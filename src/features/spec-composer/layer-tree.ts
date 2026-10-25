import type { LayerGroup, SpecDocument, SpecElement } from "./types";

export interface LayerNode {
  id: string;
  name: string;
  parentId?: string | undefined;
  element?: SpecElement;
  children: LayerNode[];
  leaves: SpecElement[];
}
export interface LayerRow extends LayerNode {
  depth: number;
}
export interface LayerDestination {
  targetId?: string;
  position: "before" | "inside" | "after";
}
export interface LayerDropPoint {
  id: string;
  x: number;
  y: number;
}
export function nextLayerDropPoint(
  points: LayerDropPoint[],
  currentId: string | undefined,
  center: { x: number; y: number },
  forward: boolean,
): LayerDropPoint | undefined {
  const ordered = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
  let index = ordered.findIndex((point) => point.id === currentId);
  if (index < 0) {
    let distance = Infinity;
    ordered.forEach((point, i) => {
      const delta = Math.hypot(point.x - center.x, point.y - center.y);
      if (delta < distance) {
        distance = delta;
        index = i;
      }
    });
  }
  return ordered[index + (forward ? 1 : -1)];
}

/** Legacy groups are derived without mutating the document or its stacking. */
export function layerGroups(doc: SpecDocument): LayerGroup[] {
  const groups = [...(doc.groups ?? [])];
  const ids = new Set([
    ...groups.map((g) => g.id),
    ...doc.elements.map((e) => e.id),
  ]);
  for (const el of [...doc.elements].sort((a, b) => b.zIndex - a.zIndex)) {
    if (el.groupId && !ids.has(el.groupId)) {
      groups.push({ id: el.groupId, name: `Group ${groups.length + 1}` });
      ids.add(el.groupId);
    }
  }
  return groups;
}

export function layerTree(doc: SpecDocument): LayerNode[] {
  const nodes = new Map<string, LayerNode>();
  for (const group of layerGroups(doc))
    nodes.set(group.id, { ...group, children: [], leaves: [] });
  for (const element of doc.elements)
    nodes.set(element.id, {
      id: element.id,
      name: element.name,
      parentId: element.groupId,
      element,
      children: [],
      leaves: [element],
    });
  const roots: LayerNode[] = [];
  for (const node of nodes.values()) {
    const seen = new Set([node.id]);
    let parent = nodes.get(node.parentId ?? "");
    let cursor = parent;
    while (cursor) {
      if (seen.has(cursor.id)) {
        parent = undefined;
        break;
      }
      seen.add(cursor.id);
      cursor = nodes.get(cursor.parentId ?? "");
    }
    if (parent && !parent.element) parent.children.push(node);
    else {
      node.parentId = undefined;
      roots.push(node);
    }
  }
  const collect = (node: LayerNode): SpecElement[] => {
    if (!node.element) node.leaves = node.children.flatMap(collect);
    node.children.sort(compareNodes);
    if (!node.element)
      node.leaves = node.children.flatMap((child) => child.leaves);
    return node.leaves;
  };
  roots.forEach(collect);
  return roots.sort(compareNodes);
}
const compareNodes = (a: LayerNode, b: LayerNode) =>
  (b.leaves.length ? Math.max(...b.leaves.map((e) => e.zIndex)) : -Infinity) -
  (a.leaves.length ? Math.max(...a.leaves.map((e) => e.zIndex)) : -Infinity);

export function flattenLayers(
  doc: SpecDocument,
  collapsed = new Set<string>(),
): LayerRow[] {
  const rows: LayerRow[] = [];
  const visit = (nodes: LayerNode[], depth: number) =>
    nodes.forEach((node) => {
      rows.push({ ...node, depth });
      if (!collapsed.has(node.id)) visit(node.children, depth + 1);
    });
  visit(layerTree(doc), 0);
  return rows;
}
export function canonicalLayers(doc: SpecDocument, ids: string[]): LayerRow[] {
  const rows = flattenLayers(doc);
  const selected = new Set(ids);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return rows.filter((row) => {
    if (!selected.has(row.id)) return false;
    let parent = row.parentId;
    while (parent) {
      if (selected.has(parent)) return false;
      parent = byId.get(parent)?.parentId;
    }
    return true;
  });
}
export function selectedLayerIds(
  doc: SpecDocument,
  leaves: string[],
  groups: string[],
): string[] {
  const groupLeaves = new Set(
    canonicalLayers(doc, groups).flatMap((n) => n.leaves.map((e) => e.id)),
  );
  return [...groups, ...leaves.filter((id) => !groupLeaves.has(id))];
}
/** Temporary alignment units keep explicit nested groups rigid without writing membership. */
export function layerAlignmentItems(
  doc: SpecDocument,
  selectedIds: string[],
  selectedGroupIds: string[],
): SpecElement[] {
  const owners = new Map(
    canonicalLayers(doc, selectedGroupIds).flatMap((node) =>
      node.leaves.map((el) => [el.id, node.id] as const),
    ),
  );
  const selected = new Set(selectedIds);
  return doc.elements
    .filter((el) => selected.has(el.id))
    .map((el) =>
      owners.has(el.id) ? { ...el, groupId: owners.get(el.id)! } : el,
    );
}
export function toggleLayerSelection(
  doc: SpecDocument,
  selected: string[],
  id: string,
  policy: "modifier" | "explicit" = "modifier",
): string[] {
  if (selected.includes(id)) return selected.filter((value) => value !== id);
  const target = flattenLayers(doc).find((row) => row.id === id);
  if (!target) return selected;
  const excluded = new Set(target.leaves.map((el) => el.id));
  const rows = flattenLayers(doc);
  const ancestors = new Set<string>();
  let parent = target.parentId;
  while (parent) {
    ancestors.add(parent);
    parent = rows.find((node) => node.id === parent)?.parentId;
  }
  const ancestor = canonicalLayers(doc, selected).find((node) =>
    ancestors.has(node.id),
  );
  if (policy === "explicit")
    return canonicalLayers(doc, [
      ...selected.filter((value) => !ancestors.has(value)),
      id,
    ]).map((node) => node.id);
  if (ancestor)
    return [
      ...selected.filter((value) => value !== ancestor.id),
      ...ancestor.leaves
        .filter((el) => !excluded.has(el.id))
        .map((el) => el.id),
    ];
  return [...selected, id];
}
export function canGroupLayers(doc: SpecDocument, ids: string[]): boolean {
  const nodes = canonicalLayers(doc, ids);
  return (
    nodes.length > 1 &&
    nodes.every(
      (n) =>
        n.parentId === nodes[0]!.parentId && !n.leaves.some((e) => e.locked),
    )
  );
}
export function layerRange(
  doc: SpecDocument,
  collapsed: Set<string>,
  anchor: string,
  end: string,
): string[] {
  const rows = flattenLayers(doc, collapsed);
  const start = rows.findIndex((r) => r.id === anchor),
    stop = rows.findIndex((r) => r.id === end);
  return start < 0 || stop < 0
    ? [end]
    : rows
        .slice(Math.min(start, stop), Math.max(start, stop) + 1)
        .map((r) => r.id);
}

export function pruneLayerGroups(doc: SpecDocument) {
  const live = new Set(
    doc.elements.flatMap((el) => (el.groupId ? [el.groupId] : [])),
  );
  const groups = layerGroups(doc);
  let changed = true;
  while (changed) {
    changed = false;
    for (const group of groups)
      if (live.has(group.id) && group.parentId && !live.has(group.parentId)) {
        live.add(group.parentId);
        changed = true;
      }
  }
  doc.groups = groups.filter((g) => live.has(g.id));
}

/** Applies one structural edit to a clone. Unaffected leaf ordering is retained. */
export function movedLayers(
  doc: SpecDocument,
  ids: string[],
  destination: LayerDestination,
): SpecDocument | undefined {
  const rows = flattenLayers(doc),
    nodes = canonicalLayers(doc, ids);
  const target = rows.find((r) => r.id === destination.targetId);
  if (
    !nodes.length ||
    (destination.targetId && !target) ||
    nodes.some((n) => n.leaves.some((e) => e.locked)) ||
    target?.leaves.some((e) => e.locked) ||
    (destination.position === "inside" && target?.element)
  )
    return;
  const parentId =
    destination.position === "inside" ? target?.id : target?.parentId;
  const movingIds = new Set(nodes.map((n) => n.id));
  if (target && movingIds.has(target.id)) return;
  let parent = parentId;
  while (parent) {
    if (movingIds.has(parent)) return;
    const ancestor = rows.find((r) => r.id === parent);
    if (ancestor?.leaves.some((e) => e.locked)) return;
    parent = ancestor?.parentId;
  }
  const next = structuredClone(doc);
  next.groups = layerGroups(next);
  for (const node of nodes) {
    const group = next.groups.find((g) => g.id === node.id);
    if (group) group.parentId = parentId;
    else next.elements.find((e) => e.id === node.id)!.groupId = parentId;
  }
  const movedLeaves = new Set(
    nodes.flatMap((node) => node.leaves.map((el) => el.id)),
  );
  const oldOrder = [...doc.elements]
    .sort((a, b) => b.zIndex - a.zIndex)
    .map((el) => el.id);
  const moved = oldOrder.filter((id) => movedLeaves.has(id));
  let ordered = oldOrder.filter((id) => !movedLeaves.has(id));
  const targets = new Set(target?.leaves.map((el) => el.id));
  const targetIndices = ordered.flatMap((id, index) =>
    targets.has(id) ? [index] : [],
  );
  const index = !target
    ? ordered.length
    : destination.position === "before"
      ? Math.min(...targetIndices)
      : Math.max(-1, ...targetIndices) + 1;
  if (!Number.isFinite(index)) return;
  ordered.splice(index, 0, ...moved);
  const membershipChanged = nodes.some((node) => node.parentId !== parentId);
  if (!membershipChanged && ordered.every((id, i) => oldOrder[i] === id))
    return;
  // Only groups whose direct membership/order changed become contiguous.
  // Unrelated legacy groups may be interleaved and must retain their exact order.
  const affected = new Set(
    [...nodes.map((node) => node.parentId), parentId].filter(
      (id): id is string => !!id,
    ),
  );
  const nextRows = flattenLayers(next);
  const normalize = (id: string) => {
    const group = nextRows.find((row) => row.id === id);
    if (!group) return;
    const leaves = new Set(group.leaves.map((el) => el.id));
    const first = ordered.findIndex((leaf) => leaves.has(leaf));
    if (first < 0) return;
    const members = ordered.filter((leaf) => leaves.has(leaf));
    ordered = ordered.filter((leaf) => !leaves.has(leaf));
    ordered.splice(first, 0, ...members);
  };
  [...affected]
    .sort(
      (a, b) =>
        (nextRows.find((r) => r.id === b)?.depth ?? 0) -
        (nextRows.find((r) => r.id === a)?.depth ?? 0),
    )
    .forEach(normalize);
  ordered.forEach((id, i) => {
    next.elements.find((el) => el.id === id)!.zIndex = ordered.length - i;
  });
  pruneLayerGroups(next);
  return next;
}

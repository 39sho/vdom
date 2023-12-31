import listDiff from 'list-diff2';
import type { VProps, VText, VTree } from './h';

type TextPatch = {
    type: 'Text',
    value: VText,
};

type ReplacePatch = {
    type: 'Replace',
    value: VTree,
};

type ReorderPatch = {
    type: 'Reorder',
    value: ChildrenPatches,
}

type PropsPatch = {
    type: 'Props',
    value: VProps,
};

type Patch = TextPatch | ReplacePatch | ReorderPatch | PropsPatch;

type Patches = Array<Array<Patch>>;

type Diff = (oldTree: VTree, newTree: VTree) => Patches;

const diff: Diff = (oldTree, newTree) => {
    let index = 0;
    const patches: Patches = [];
    walk(oldTree, newTree, patches, index);
    return patches;
};

type Walk = (oldTree: VTree, newTree: VTree, patches: Patches, index: number) => void;

const walk: Walk = (oldTree, newTree, patches, index) => {
    const currPatches: Array<Patch> = [];

    if (newTree == null) {

    } else if (oldTree.type === 'VText' && newTree.type === 'VText') {
        if (oldTree.value !== newTree.value) {
            const patch: TextPatch = {
                type: 'Text',
                value: newTree,
            };

            currPatches.push(patch);
        }
    } else if (oldTree.type === 'VNode' && newTree.type === 'VNode' && oldTree.tagName === newTree.tagName) {
        const propsPatches: PropsPatches = diffProps(oldTree.props, newTree.props);

        if (propsPatches != null) {
            const patch: PropsPatch = {
                type: 'Props',
                value: propsPatches,
            };

            currPatches.push(patch);
        }

        diffChildren(oldTree.children, newTree.children, patches, index, currPatches);
    } else {
        const patch: ReplacePatch = {
            type: 'Replace',
            value: newTree,
        };

        currPatches.push(patch);
    }

    if (currPatches.length > 0)
        patches[index] = currPatches;
};

type ChildrenPatches = Moves<VTree>;

type DiffChildren = (oldChildren: Array<VTree>, newChildren: Array<VTree>, patches: Patches, index: number, currPatches: Array<Patch>) => void;

const diffChildren: DiffChildren = (oldChildren, newChildren, patches, index, currPatches) => {
    const diffs = listDiff(oldChildren, newChildren, 'key');

    if (diffs.moves.length > 0) {
        const patch: ReorderPatch = {
            type: 'Reorder',
            value: diffs.moves,
        };

        currPatches.push(patch);
    }

    diffs.moves.forEach((move) => {
        if (move.type === 0) {
            oldChildren.splice(move.index, 1);
        } else {
            oldChildren.splice(move.index, 0, move.item);
        }
    });



    let leftNodeLen = 1;
    let currIndex = index;
    oldChildren.forEach((oldChild, i) => {
        const newChild = newChildren[i];

        currIndex = leftNodeLen + currIndex;
        walk(oldChild, newChild, patches, currIndex);
        leftNodeLen = count(oldChild)
    });
};

type PropsPatches = VProps | null;

const diffProps = (oldProps: VProps, newProps: VProps): PropsPatches => {
    const isEqual = JSON.stringify(oldProps) === JSON.stringify(newProps);

    return isEqual ? null : newProps;
};

export default diff;

export type {
    Patches,
};

type Count = (vtree: VTree) => number;

const count: Count = (vtree) => {
    if (vtree.type === 'VText') {
        return 1;
    }

    let n = 1;
    for (const child of vtree.children) {
        n += count(child);
    }

    return n;
};
import type { GameObject, MoveObject, ObjectMoved } from '@pi-steps/core';
import { defineComponent, h, onMounted, onUnmounted, shallowRef } from 'vue';
import type { PropType } from 'vue';

/** Events replace snapshots; no gameplay instance is imported or mutated. */
export function createMoveProjection(initialObject: GameObject) {
  const state = shallowRef<GameObject>({ ...initialObject });
  return {
    state,
    apply(event: ObjectMoved) {
      if (event.id === state.value.id) {
        state.value = { id: event.id, x: event.x, y: event.y };
      }
    },
  };
}

export function createUiMoveAction(send: (command: MoveObject) => void) {
  return (target: GameObject) => send({ type: 'MoveObject', ...target });
}

export const MoveDemo = defineComponent({
  name: 'MoveDemo',
  props: {
    object: { type: Object as PropType<GameObject>, required: true },
    move: { type: Function as PropType<(target: GameObject) => void>, required: true },
    mountScene: {
      type: Function as PropType<(host: HTMLElement) => Promise<() => void>>,
      required: true,
    },
  },
  setup(props) {
    const host = shallowRef<HTMLElement>();
    const error = shallowRef('');
    const ready = shallowRef(false);
    let stopped = false;
    let dispose: (() => void) | undefined;
    onMounted(async () => {
      try {
        const cleanup = await props.mountScene(host.value!);
        if (stopped) cleanup();
        else {
          dispose = cleanup;
          ready.value = true;
        }
      } catch (cause) {
        if (!stopped) error.value = `Scene failed: ${String(cause)}`;
      }
    });
    onUnmounted(() => {
      stopped = true;
      dispose?.();
    });
    return () => h('main', [
      h('h1', 'Bootstrap prototype'),
      h('p', { role: 'status' }, `A: (${props.object.x}, ${props.object.y})`),
      h('button', {
        type: 'button',
        disabled: !ready.value,
        onClick: () => props.move({ id: props.object.id, x: 30, y: 40 }),
      }, 'Move A to (30, 40)'),
      h('p', 'Click the scene to move A in World Coordinates.'),
      error.value ? h('p', { role: 'alert' }, error.value) : null,
      h('div', {
        ref: host,
        'data-testid': 'scene',
        style: { width: '100%', height: '60vh', overflow: 'hidden' },
      }),
    ]);
  },
});

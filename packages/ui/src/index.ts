import { defineComponent, h } from 'vue';

export { createMoveProjection, createUiMoveAction, MoveDemo } from './move-demo';

/** Presentation only: the owning application supplies state and handles actions. */
export const AppShell = defineComponent({
  name: 'AppShell',
  props: {
    title: { type: String, required: true },
    status: { type: String, required: true },
  },
  emits: ['check'],
  setup(props, { emit }) {
    return () => h('main', [
      h('h1', props.title),
      h('p', 'Project scaffold — gameplay is not implemented.'),
      h('p', { role: 'status' }, props.status),
      h('button', { type: 'button', onClick: () => emit('check') }, 'Check setup'),
    ]);
  },
});

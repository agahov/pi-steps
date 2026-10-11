import { defineComponent, h } from 'vue';

/** Presentation only; the application supplies the title and current status. */
export const ApplicationShell = defineComponent({
  name: 'ApplicationShell',
  props: {
    title: { type: String, required: true },
    status: { type: String, required: true },
  },
  setup(props) {
    return () => h('main', [
      h('h1', props.title),
      h('p', { role: 'status' }, props.status),
    ]);
  },
});

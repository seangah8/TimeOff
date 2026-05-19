import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VacationForm from '@/components/vacation/VacationForm.vue';

const DatePickerStub = {
  props: ['modelValue', 'minDate', 'disabled', 'showIcon', 'fluid', 'dateFormat', 'placeholder'],
  emits: ['update:modelValue'],
  template: `
    <input
      class="dp-input"
      type="date"
      :value="modelValue ? modelValue.toISOString().slice(0, 10) : ''"
      @input="$emit('update:modelValue', $event.target.value ? new Date($event.target.value + 'T00:00:00Z') : null)"
    />
  `,
};

const TextareaStub = {
  props: ['modelValue', 'disabled', 'placeholder', 'rows'],
  emits: ['update:modelValue'],
  template: `<textarea class="ta-input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
};

const ButtonStub = {
  props: ['label', 'loading', 'severity', 'size', 'icon', 'text', 'disabled'],
  template: `<button type="submit" />`,
};

const globalConfig = {
  stubs: { DatePicker: DatePickerStub, Textarea: TextareaStub, Button: ButtonStub },
};

describe('VacationForm', () => {
  function mountForm() {
    return mount(VacationForm, { props: { submitting: false }, global: globalConfig });
  }

  it('shows error when both dates are missing', async () => {
    const wrapper = mountForm();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.field-error').text()).toBe('Both start and end dates are required.');
    expect(wrapper.emitted('submitted')).toBeUndefined();
  });

  it('shows error when end date is before start date', async () => {
    const wrapper = mountForm();
    const inputs = wrapper.findAll('.dp-input');
    await inputs[0].setValue('2024-03-10');
    await inputs[1].setValue('2024-03-05');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.field-error').text()).toBe('End date cannot be before start date.');
    expect(wrapper.emitted('submitted')).toBeUndefined();
  });

  it('emits submitted with ISO dates and trimmed reason', async () => {
    const wrapper = mountForm();
    const inputs = wrapper.findAll('.dp-input');
    await inputs[0].setValue('2024-03-10');
    await inputs[1].setValue('2024-03-15');
    await wrapper.find('.ta-input').setValue('  summer break  ');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submitted')?.[0]).toEqual([
      { startDate: '2024-03-10', endDate: '2024-03-15', reason: 'summer break' },
    ]);
  });
});

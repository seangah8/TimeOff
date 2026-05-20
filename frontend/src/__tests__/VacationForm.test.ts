import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VacationForm from '@/components/vacation/VacationForm.vue';

// Replace PrimeVue's DatePicker with a plain <input type="date"> so tests can set values with setValue().
// The stub converts the Date object that DatePicker emits into a string the input can display,
// and converts it back to a Date on input — matching the real component's v-model contract.
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

// Replace PrimeVue's Textarea with a plain <textarea> so setValue() works normally in tests.
const TextareaStub = {
  props: ['modelValue', 'disabled', 'placeholder', 'rows'],
  emits: ['update:modelValue'],
  template: `<textarea class="ta-input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
};

// Replace PrimeVue's Button with a plain <button type="submit"> so form.trigger('submit') works.
const ButtonStub = {
  props: ['label', 'loading', 'severity', 'size', 'icon', 'text', 'disabled'],
  template: `<button type="submit" />`,
};

// Register all three stubs globally so any nested component that uses them is also replaced.
const globalConfig = {
  stubs: { DatePicker: DatePickerStub, Textarea: TextareaStub, Button: ButtonStub },
};

describe('VacationForm', () => {
  // Helper that mounts VacationForm with submitting=false and the PrimeVue stubs.
  // Each test calls this so it always starts with a fresh, clean form instance.
  function mountForm() {
    return mount(VacationForm, { props: { submitting: false }, global: globalConfig });
  }

  it('shows error when both dates are missing', async () => {
    // Submit the form without filling in any fields.
    // The form must catch the missing dates client-side and show an error — not emit 'submitted'.
    const wrapper = mountForm();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.field-error').text()).toBe('Both start and end dates are required.');
    // 'submitted' must not be emitted when there is a validation error.
    expect(wrapper.emitted('submitted')).toBeUndefined();
  });

  it('shows error when end date is before start date', async () => {
    // inputs[0] = startDate picker, inputs[1] = endDate picker.
    // Setting end (Mar 5) before start (Mar 10) is an invalid date range.
    const wrapper = mountForm();
    const inputs = wrapper.findAll('.dp-input');
    await inputs[0].setValue('2024-03-10');
    await inputs[1].setValue('2024-03-05');
    await wrapper.find('form').trigger('submit');
    // The custom date-order validator in the form must catch this and show the appropriate error.
    expect(wrapper.find('.field-error').text()).toBe('End date cannot be before start date.');
    expect(wrapper.emitted('submitted')).toBeUndefined();
  });

  it('emits submitted with ISO dates and trimmed reason', async () => {
    // Fill in a valid date range and a reason with surrounding whitespace.
    // The form must trim the reason before emitting and format dates as YYYY-MM-DD strings.
    const wrapper = mountForm();
    const inputs = wrapper.findAll('.dp-input');
    await inputs[0].setValue('2024-03-10');
    await inputs[1].setValue('2024-03-15');
    await wrapper.find('.ta-input').setValue('  summer break  ');
    await wrapper.find('form').trigger('submit');
    // The emitted payload must have trimmed reason and correctly formatted date strings.
    expect(wrapper.emitted('submitted')?.[0]).toEqual([
      { startDate: '2024-03-10', endDate: '2024-03-15', reason: 'summer break' },
    ]);
  });
});

interface ToggleProps {
  label: string;
  checked: boolean | (() => boolean);
  onChange: (checked: boolean) => void;
}

export function Toggle(props: ToggleProps) {
  const getChecked = () => typeof props.checked === 'function' ? props.checked() : props.checked;

  const handleClick = () => {
    props.onChange(!getChecked());
  };

  return (
    <div class="flex items-center justify-between py-1 cursor-pointer" onClick={handleClick}>
      <span class="text-xs text-gray-600 dark:text-gray-300">
        {props.label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={getChecked()}
        classList={{
          'relative w-8 h-4 rounded-full transition-colors cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-blue-500': true,
          'bg-blue-500': getChecked(),
          'bg-gray-300 dark:bg-gray-600': !getChecked(),
        }}
      >
        <span
          classList={{
            'absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform': true,
            'translate-x-4': getChecked(),
          }}
        />
      </button>
    </div>
  );
}
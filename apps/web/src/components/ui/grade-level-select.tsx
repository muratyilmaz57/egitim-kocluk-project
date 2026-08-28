import { GRADE_LEVELS, gradeLevelLabel } from "@web/lib/grade-levels";

type GradeLevelSelectProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  includeEmpty?: boolean;
  emptyLabel?: string;
};

export function GradeLevelSelect({
  name = "gradeLevel",
  value,
  defaultValue,
  onChange,
  required,
  includeEmpty = false,
  emptyLabel = "Sınıf seçiniz",
}: GradeLevelSelectProps) {
  return (
    <select
      name={name}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      required={required}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
    >
      {includeEmpty ? <option value="">{emptyLabel}</option> : null}
      {GRADE_LEVELS.map((gradeLevel) => (
        <option key={gradeLevel} value={gradeLevel}>
          {gradeLevelLabel(gradeLevel)}
        </option>
      ))}
    </select>
  );
}

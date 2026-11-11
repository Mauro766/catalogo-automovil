interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchField = ({ value, onChange, placeholder = 'Buscar...' }: SearchFieldProps) => {
  return (
    <label className="search-field">
      <span className="sr-only">Buscar</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
};

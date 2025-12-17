import { useState } from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { X, Plus } from "lucide-react";

interface MultiValueInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  validator?: (value: string) => string | null; // Returns error message or null
  helperText?: string;
}

export function MultiValueInput({
  label,
  values,
  onChange,
  placeholder = "Add value...",
  validator,
  helperText,
}: MultiValueInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    
    if (!trimmed) {
      setError("Value cannot be empty");
      return;
    }

    if (values.includes(trimmed)) {
      setError("Value already exists");
      return;
    }

    if (validator) {
      const validationError = validator(trimmed);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onChange([...values, trimmed]);
    setInputValue("");
    setError(null);
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Display current values */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50 min-h-[2.5rem]">
          {values.map((value, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {value}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={error ? "border-destructive" : ""}
        />
        <Button type="button" onClick={handleAdd} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

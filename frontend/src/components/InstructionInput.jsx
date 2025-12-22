export default function InstructionInput({ value, onChange, disabled }) {
  return (
    <div className="instruction-input">
      <label htmlFor="instruction">Processing Instruction</label>
      <textarea
        id="instruction"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your instruction here... (e.g., 'Compress this PDF to email size using Ghostscript')"
        disabled={disabled}
        rows={4}
      />
    </div>
  );
}


import { Badge } from "@/components/ui/badge";

interface TemplateVariablesProps {
  onInsertVariable?: (variable: string) => void;
  showHelp?: boolean;
}

/**
 * Reusable component for template variables
 * If onInsertVariable is provided, variables become clickable
 */
export function TemplateVariables({ onInsertVariable, showHelp = true }: TemplateVariablesProps) {
  const variables = [
    { name: '[Customer Name]', description: 'Inserts the customer\'s full name' },
    { name: '[Business Name]', description: 'Inserts your business name' },
    { name: '[Review Link]', description: 'Inserts your Google review link' },
    { name: '[Date]', description: 'Inserts the current date' }
  ];
  
  const isClickable = typeof onInsertVariable === 'function';
  
  return (
    <div className="py-2 px-3 bg-gray-100 rounded-md text-sm text-black">
      <p className="font-medium mb-1">Available Variables:</p>
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <Badge 
            key={variable.name}
            className={`bg-gray-200 text-gray-800 hover:bg-gray-300 ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={isClickable ? () => onInsertVariable(variable.name) : undefined}
            title={variable.description}
          >
            {variable.name}
          </Badge>
        ))}
      </div>
      {showHelp && isClickable && (
        <p className="mt-2 text-xs text-gray-600">Click on any variable to insert it at the cursor position.</p>
      )}
    </div>
  );
}
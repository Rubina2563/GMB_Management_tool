import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  children,
  titleClassName = "text-black",
  descriptionClassName = "text-gray-600"
}) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center">
        <h1 className={`text-3xl font-bold ${titleClassName}`}>{title}</h1>
        {children}
        {description && (
          <p className={`mt-2 ${descriptionClassName}`}>{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
import React from 'react';
import { Empty } from 'antd';

interface ImportExportProps {
  mode: 'import' | 'export';
}

const ImportExport: React.FC<ImportExportProps> = ({ mode }) => (
  <Empty description={`${mode === 'import' ? 'Import' : 'Export'} - Coming Soon`} />
);

export default ImportExport;

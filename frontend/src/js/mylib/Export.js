export const exportXLSXArray = async (data, filename) => {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = fitToColumn(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SheetJS');
  XLSX.writeFile(wb, filename);
};

export const fitToColumn = (data) => {
  const columnWidths = [];
  for (const property in data[0]) {
    columnWidths.push({
      wch: Math.max(
        property ? property.toString().length : 0,
        ...data.map((obj) =>
          obj[property] ? obj[property].toString().length : 0
        )
      ),
    });
  }
  return columnWidths;
};

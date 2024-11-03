import { toast } from "sonner";
import Papa from 'papaparse';
import JSZip from 'jszip';
import { Dataset } from "./types";

export const useDatasetExport = () => {
  const exportData = async (format: 'csv' | 'txt' | 'zip', dataset: Dataset) => {
    try {
      const dataToExport = {
        id: dataset.id,
        name: dataset.name,
        downloads: dataset.downloads,
        likes: dataset.likes,
        description: dataset.description,
      };

      let content: string | Blob;
      let filename: string;

      switch (format) {
        case 'csv':
          content = Papa.unparse([dataToExport]);
          filename = `${dataset.name}.csv`;
          break;
        case 'txt':
          content = JSON.stringify(dataToExport, null, 2);
          filename = `${dataset.name}.txt`;
          break;
        case 'zip':
          const zip = new JSZip();
          zip.file(`${dataset.name}.json`, JSON.stringify(dataToExport, null, 2));
          const blob = await zip.generateAsync({ type: "blob" });
          content = blob;
          filename = `${dataset.name}.zip`;
          break;
      }

      const link = document.createElement('a');
      if (content instanceof Blob) {
        link.href = URL.createObjectURL(content);
      } else {
        link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Dataset exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export dataset: ${error.message}`);
    }
  };

  return { exportData };
};
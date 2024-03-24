// dataSaver.js

export function saveDataToFile(data, fileName) {
    // Convert data to JSON string
    const jsonData = JSON.stringify(data);
  
    // Create a Blob object with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });
  
    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);
  
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
  
    // Set the download attribute with desired file name
    a.download = fileName;
  
    // Programmatically click the anchor element to trigger download
    a.click();
  
    // Cleanup: Revoke the temporary URL
    URL.revokeObjectURL(url);
  }
  
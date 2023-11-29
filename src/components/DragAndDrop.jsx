import styles from './DragAndDrop.module.css';
import { useEffect, useRef, useState } from 'react';

const DragAndDrop = () => {
  const [dragOver, setDragOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState([]);
  const [loadingStates, setLoadingStates] = useState([]);
  const abortControllerRef = useRef(new AbortController());

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    setDroppedFiles([]);
    setLoadingStates(new Array(files.length).fill(true));

    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    if (files && files.length > 0) {
      const url = `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUD_NAME
      }/upload`;
      for (let file of files) {
        try {
          const formData = new FormData();
          const fields = {
            file,
            upload_preset: import.meta.env.VITE_UPLOAD_PRESET,
            tags: ['myphotoalbum-react'],
            multiple: true,
            resource_type: 'image',
          };

          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value);
          });

          const options = {
            method: 'POST',
            body: formData,
            signal: abortControllerRef.current.signal,
          };
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error('Failed to execute file upload via the Fetch API');
          }
          const json = await response.json();
          const secureUrl = json.secure_url;
          const previewUrl = secureUrl.replace('/upload/', '/upload/w_400/');

          setDroppedFiles((prevFiles) => [...prevFiles, { file, previewUrl }]);
          setLoadingStates((prevStates) =>
            prevStates.map((state, index) =>
              file === files[index] ? false : state
            )
          );
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error(error);
          }
          setLoadingStates((prevStates) =>
            prevStates.map((state, index) =>
              file === files[index] ? false : state
            )
          );
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      abortControllerRef.current.abort();
    };
  }, []);

  return (
    <>
      <div
        className={`${styles.dragArea} ${dragOver ? `${styles.dragOver}` : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Drag and drop images here</p>
      </div>
      {loadingStates.some((loading) => loading) && (
        <>
          <p>Image upload in progress</p>
          <span className="loading loading-spinner text-primary"></span>
        </>
      )}
      {droppedFiles.length !== 0 && (
        <div>
          <h2>Uploaded images:</h2>
          <ul>
            {droppedFiles.map((droppedFile, index) => (
              <li key={index}>
                <strong>{droppedFile.file.name}</strong>
                <br />
                <img
                  src={droppedFile.previewUrl}
                  alt={`Preview of ${droppedFile.file.name}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100px',
                    marginTop: '5px',
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default DragAndDrop;

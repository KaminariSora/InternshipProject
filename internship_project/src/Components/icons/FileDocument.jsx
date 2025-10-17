import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile } from "@fortawesome/free-solid-svg-icons";


const FileDocument = ({size}) => {
    return (
        <FontAwesomeIcon icon={faFile} 
        size={size}/>
    );
};

export default FileDocument;
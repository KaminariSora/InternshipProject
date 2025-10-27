import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";


const DownloadIcon = ({ size }) => {
    return (
        <FontAwesomeIcon
            icon={faDownload}
            size={size} />
    );
};

export default DownloadIcon;
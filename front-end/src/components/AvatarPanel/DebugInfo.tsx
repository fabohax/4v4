import React from 'react';

interface DebugInfoProps {
    cameraPosition: string;
    cameraZoom: number;
    lightIntensity: number;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ 
    cameraPosition, 
    cameraZoom, 
    lightIntensity 
}) => {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '0px',
                right: '0px',
                backgroundColor: 'rgba(253, 253, 253)',
                color: 'black',
                padding: '5px',
                borderRadius: '5px',
                fontSize: '12px',
                textAlign: 'right',
            }}
            className='flex space-x-4'
        >
            <div>{cameraPosition}</div>
            <div>{cameraZoom.toFixed(2)}</div>
            <div>{lightIntensity.toFixed(2)}</div>
        </div>
    );
};

export default DebugInfo;
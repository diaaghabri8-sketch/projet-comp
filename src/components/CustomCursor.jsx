import React from 'react';

const CustomCursor = () => {
    // Returning null to restore the standard OS cursor with zero decoration
    return (
        <style dangerouslySetInnerHTML={{ __html: `
            * {
                cursor: auto !important;
            }
            a, button, .nav-brand, .pc-action, .btn {
                cursor: pointer !important;
            }
        `}} />
    );
};

export default CustomCursor;

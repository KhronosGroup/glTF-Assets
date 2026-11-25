"use client"

import { Fab, Tooltip } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';

const BugReportButton = () => {
  return (
    <>
      <Tooltip title="Report an issue" slotProps={{tooltip: { sx: {color: 'text.primary'}}}}>
        <Fab 
          color="primary" 
          href="https://github.com/KhronosGroup/glTF-Assets/issues"
          target='_blank'
          role="link"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <EditNoteIcon />
        </Fab>
      </Tooltip>
    </>
  );
};

export default BugReportButton;
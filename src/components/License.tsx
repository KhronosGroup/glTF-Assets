"use client"

import { Tooltip, Box } from '@mui/material';
import { SxProps, Theme } from "@mui/material/styles";

export type LicenseProps = {
    title: string, 
    url: string,
    iconURL: string,
    sx?: SxProps<Theme>
}

const License = ({title, url, iconURL, sx} : LicenseProps) => {
  return (
    <Box sx={sx}>
      <Tooltip title={title} slotProps={{tooltip: { sx: {color: 'text.primary'}}}}>
        <a 
          color="primary" 
          href={url}
          target='_blank'
        >
            <img height={16} src={iconURL} alt={title}/>
        </a>
      </Tooltip>
    </Box>
  );
};

export default License;
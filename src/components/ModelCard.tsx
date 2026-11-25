"use client"
import React from 'react'
import Image from 'next/image'
import NextLink from 'next/link';
import Link from '@mui/material/Link';
import { Box, Chip, Typography, Grid } from "@mui/material";
import { basePath } from '@/lib/paths';

export type ModelCardProps = {
    name: string, //clickable string
    title: string,
    thumbnail: string
}

export default function ModelCard({name, title, thumbnail}: ModelCardProps) {
  return (
      <Box
        sx={{
          width: {xs: '100%', sm: '400px' },
          margin: {xs: '5px 5px', sm: '10px 5px'},
          padding: '10px',
          "&:hover": {
            backgroundColor: 'grey.700',
            boxShadow: 3,
            borderRadius: "16px"
          },
        }}>
        <Grid container sx={{justifyContent: "center"}}>
          <Link component={NextLink} href={encodeURI(`/model/${name}`)}>
            <Image
              width={512}
              height={512}
              unoptimized
              /* Added color: '' because of https://github.com/vercel/next.js/issues/45184 */
              style={{ color: '', width: '100%', height: "auto", maxWidth: "100%", textAlign: "center", cursor: 'pointer', objectFit: 'contain', borderRadius: '16px'}}
              src={`${basePath}${encodeURI(thumbnail)}`}
              alt={title}  
              loading="lazy"
            />
          </Link>
        </Grid>
        <Box sx={{display: "flex", flexDirection: "column", p: 0}}>
          <Typography sx={{fontSize: 18, fontWeight: 'bold', overflowWrap: "anywhere", textAlign:'center'}}>{title}</Typography>
        </Box>          
      </Box>
  );
}
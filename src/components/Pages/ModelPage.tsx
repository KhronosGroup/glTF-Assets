"use client"
import React from 'react';
import { Chip, Typography, Box, Grid, Divider, Snackbar, Link } from "@mui/material";
import ModelRenderCard from "@/components/ModelRenderCard"
import styles from "./ModelPage.module.css";
import LaunchIcon from '@mui/icons-material/Launch';
import ShareIcon from '@mui/icons-material/Share';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LivePreviewSampleRenderer from '@/components/LivePreviewSampleRenderer'
import { basePath } from '@/lib/paths';
import { ModelType } from '@/lib/types';
import { Stats } from "@/components/LivePreviewSampleRenderer";
import { toReadableBytes, toReadableNumber } from '@/lib/conversions';
import License from '../License';

type ExternalLinkProps = {
  url: string,
  alt?: string
}
function ExternalLink( {url, alt, children} : React.PropsWithChildren<ExternalLinkProps>) {
  return (<Link href={url} color="#0366d6" underline='hover' target="_blank" rel="noopener" aria-label={alt} sx={{fontWeight:'bold', display:'flex', alignItems:'center'}}>{children} <LaunchIcon fontSize='small' sx={{ml:0.5}}/></Link>)
}

type ModelPageProps = {
  name: string,
  label: string,
  description: string,
  image: string,
  tags: string[],
  modelURL: string,
  downloadUrl?: string,
  model: ModelType,
  showcaseModels: Array<ModelType>
  suggestedModels: Array<ModelType>
}

export default function ModelPage({name, label, image, tags, description, modelURL, downloadUrl, model, showcaseModels, suggestedModels}: ModelPageProps) {  
  const [shareSnackbarOpen, setShareSnackbarOpen] = React.useState(false);

  const [meshStats, setMeshStats] = React.useState<Stats>({
    totalImagesFileSize: 0,
    numberOfVertices: 0,
    numberOfFaces: 0,
    totalFileSize: 0
  });

  const image1 = `${basePath}${encodeURI(image)}`;

  const onShare = () => {
    const shareURL = `${basePath}/model/${name}`;
    if (navigator.share) {
      navigator.share({
        title: `Khronos Sample Assets`,
        url: shareURL
      }).then(() => {
        console.log('Thanks for sharing!');
      })
      .catch(console.error);
    } else {
      // fallback
      navigator.clipboard.writeText(shareURL);
      setShareSnackbarOpen(true);
    }
  }

  return (
    <Box sx={{display: "flex", width: '100%', flexDirection: {md: 'row', xs:'column'}}}>
      {/* Main Content */}
      <Box sx={{flex: 4, p: {md: 2, xs: 0}}}>
        <LivePreviewSampleRenderer src={modelURL} imgSrc={image1} variants={model.variants} statsCallback={setMeshStats}/>
        <Typography variant='h5' component="h1" sx={{paddingTop: 2}}>{label}</Typography>
        <Typography variant='body1' component='span' sx={{ml:1, fontWeight:'bold'}}>by: </Typography>{model.authors.join(", ")}
        {/* Tags */}
        <Box sx={{display: 'flex', flexDirection: 'row', flexWrap: "wrap", mt: 2}}>
          {tags.map((e,i) => {
            return <Chip key={e} label={e} sx={(theme) => ({
              ml : {
                xs: 1,
                md: i==0? 0 : 1,
              },
              mb: {
                xs: 1,
                md: 0
              }, 
              bgcolor: 'grey.100',
              color: '#fff',
              ...theme.applyStyles('dark', {
                color: 'rgba(0, 0, 0, 0.87)',
              }),
            })} />})
          }
          </Box>
        {/* Actions */}
        <Box sx={{display: 'flex', flexDirection: {xs:'column', md:'row'}, width: '100%', justifyContent: 'flex-start', mt: 2}}>
          {downloadUrl && <Box sx={{mr: 3}}>
            <Link href={downloadUrl} color="#0366d6" underline='hover' rel="noopener" sx={{fontWeight:'bold', display:'flex', alignItems:'center'}}>Download GLB<FileDownloadIcon fontSize='small' sx={{ml: 0.5}}/></Link>
          </Box>}
          <Box sx={{mr: 3}}>
            <Link onClick={onShare} href="#" color="#0366d6" underline='hover' sx={{fontWeight:'bold', display:'flex', alignItems:'center'}} aria-label='Share this link'>Share <ShareIcon fontSize='small' sx={{ml: 0.5}}/></Link>
          </Box>
          {downloadUrl && <Box sx={{mr: 3}}>
            <ExternalLink url={`https://github.khronos.org/glTF-Sample-Viewer-Release/?model=${downloadUrl}`}>View on Sample Viewer</ExternalLink>
          </Box>}
          {model.isOnRenderFidelity && <Box sx={{mr: 3}}>
            <ExternalLink url={`https://github.khronos.org/glTF-Render-Fidelity/model/${name}`}>View on Render Fidelity</ExternalLink>
          </Box>}
          <Box sx={{mr: 1}}>
            <ExternalLink url={`https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/${model.folder}/README.md`} alt="Description on GitHub">More info</ExternalLink>
          </Box>
        </Box>
        <Divider />
        {/* Quck Info */}
        <Box sx={{display: 'flex', flexDirection: {xs:'column', md:'row'}, mt: 2}}>
          <Box sx={{mr: 2}}>
            <Typography component="span">{"Triangles:"}</Typography> <Typography component="span" sx={{fontWeight:'bold'}}>{toReadableNumber(meshStats.numberOfFaces)}</Typography>
          </Box>
          <Box sx={{mr: 2}}>
            <Typography component="span">{"Vertices:"}</Typography> <Typography component="span" sx={{fontWeight:'bold'}}>{toReadableNumber(meshStats.numberOfVertices)}</Typography>
          </Box>
          <Box sx={{mr: 2}}>
            <Typography component="span">{"File Size:"}</Typography> <Typography component="span" sx={{fontWeight:'bold'}}>{toReadableBytes(meshStats.totalFileSize)}</Typography>
          </Box>
          {meshStats.totalImagesFileSize > 0 && <Box sx={{mr: 2}}>
            <Typography component="span">{"Images Size:"}</Typography> <Typography component="span" sx={{fontWeight:'bold'}}>{toReadableBytes(meshStats.totalImagesFileSize)}</Typography>
          </Box>}
          {meshStats.fileFormat && <Box sx={{mr: 2}}>
            <Typography component="span">{"File Format:"}</Typography> <Typography component="span" sx={{fontWeight:'bold'}}>{meshStats.fileFormat}</Typography>
          </Box>}
          
        </Box>
        {/* Description */}
        <Box sx={{display: 'flex', mt: 2}}>
          <Typography>{description}</Typography>          
        </Box>
        {/* License */}
        <Box sx={{display: 'flex', mt: 2}}>
          <Typography variant='body1' sx={{mr:1, fontWeight:'bold'}}>License: </Typography>{model.license.filter((item, index, arr) => index === arr.findIndex(o => o.license === item.license)).map(e => <License key={e.license} title={e.license} url={e.url} iconURL={e.icon} sx={{mr: 1}} />)}
        </Box>


      </Box>
      {/* Right Content - Suggested */}
      <Box sx={{flex: 1, mt: {md: 0, xs: 2}}}>
        <Grid className={styles.side} sx={{overflow: "auto", width:'100%', height: "80vh"}} container spacing={2}>
          <Box sx={{display: "flex", mt: 1, width: '100%'}}><Typography variant='h6' component='h2'>{"Related Assets"}</Typography></Box>
          {showcaseModels.map((e,i) => { return <ModelRenderCard key={e.name+""+i} name={e.name} label={e.label} thumbnail={e.thumbnail} />})}
          <Box sx={{display: "flex", mt: 1, width: '100%'}}><Typography variant='h6' component='h2'>{"See Also"}</Typography></Box>
          {suggestedModels.map((e,i) => { return <ModelRenderCard key={e.name+""+i} name={e.name} label={e.label} thumbnail={e.thumbnail} />})}
        </Grid>
      </Box>
    </Box>);
}
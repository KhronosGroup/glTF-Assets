"use client"
import React from 'react'
import { Box, Chip, Typography, Grid } from "@mui/material";
import Search from "@/components/Search";
import Fuse from 'fuse.js'
import ModelCard from "@/components/ModelCard";
import tagsFile from "@/data/tags.json"
import styles from "./LandingPage.module.css";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HelpIcon from '@mui/icons-material/Help';
import Tooltip from '@mui/material/Tooltip';
import Image from 'next/image'
import { basePath } from '@/lib/paths';
import { ModelType } from '@/lib/types';

type LandingPageProps = {
  models: Array<ModelType>
}

const tags = tagsFile.tags
  .map(t => {return {name: t, selected: t === "Showcase", index: 0}})
  .sort((a, b) => b.name.length - a.name.length)
  .sort((a,b) => a.selected && b.selected? 0 : a.selected? -1 : b.selected? 1 : 0);

const options = {
  includeScore: true,
  shouldSort: true,
  ignoreLocation: true,
  threshold: 0.25,
  // Search in `description`, `name` and `keywords`
  keys: ['description', 'name', 'keywords'],
}
export default function LandingPage({models}: LandingPageProps) {

  const scrollWrapperRef = React.useRef<HTMLDivElement>(null);
  const tagContainerRef = React.useRef<HTMLDivElement>(null);
  const mainContainerRef = React.useRef<HTMLDivElement>(null);
  const [selectedTags, setSelectedTags] = React.useState(tags);
  const [searchValue, setSearchValue] = React.useState("");
  const [tagsExpanded, setTagsExpanded] = React.useState(false);
  const [isOverflown, setOverflown] = React.useState(false);


  const handleSearchValueChange = (e:string) => {
    setSearchValue(e);
  }

  const handleHorizontalScrolling = (event: WheelEvent) => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollLeft += event.deltaY/3;
      // Prevent vertical scrolling
      event.preventDefault();
    }
  };

  React.useEffect(() => {
    if(scrollWrapperRef && scrollWrapperRef.current) { 
      scrollWrapperRef.current.addEventListener('wheel', handleHorizontalScrolling, {passive: false});
    }
    if(tagContainerRef && tagContainerRef.current &&
       mainContainerRef && mainContainerRef.current
    ) {
      const mainContainer = mainContainerRef.current;
      const tagContainer = tagContainerRef.current;
      const prepareTags = async () => {
        const resizeObserver = new ResizeObserver(() => {
          setOverflown(tagContainer.clientWidth === mainContainer.clientWidth);
        });

        resizeObserver.observe(mainContainer);

        return resizeObserver;
      }

      const resizeObserverPromise = prepareTags();

      return () => {resizeObserverPromise.then(res => {res.disconnect()})}
    }

  }, []);

  const handleChipDelete = (tag: {name: string, selected: boolean}) => {
    //console.log("Delete", tag);
    setSelectedTags(prevItems => {
      const temp = tags.map(t => {return {...t, selected: false}}); // deep copy (also remove showcase from selected)
      prevItems.filter(t => t.selected).forEach(t => {const item = temp.find(e => e.name === t.name); if(item) item.selected = true;})

      const item = temp.find(e => e.name == tag.name);
      if(item)
      {
        item.selected = false;
      }
      return [...temp].sort((a,b) => a.selected && b.selected? 0 : a.selected? -1 : b.selected? 1 : 0);
    })
  }
  const handleChipSelection = (tag: {name: string, selected: boolean}) => {
    //console.log("Add", tag);
    setSelectedTags(prevItems => {
      const temp = tags.map(t => {return {...t, selected: false}}); // deep copy (also remove showcase from selected)
      prevItems.filter(t => t.selected).forEach(t => {const item = temp.find(e => e.name === t.name); if(item) item.selected = true;})

      const item = temp.find(e => e.name == tag.name);
      if(item)
      {
        item.selected = true;
      }
      return [...temp].sort((a,b) => a.selected && b.selected? 0 : a.selected? -1 : b.selected? 1 : 0);
    })
  }

  const otherChips = (
    <Box ref={mainContainerRef} sx={{width: "100%", justifyContent: "center", display: "flex", flexWrap: "nowrap", flexDirection: "row"}}>
      <Box ref={tagContainerRef} sx={{display: "flex", flexWrap: "nowrap", flexDirection: "row"}}>
        <Box sx={{display: "flex", flexWrap: "wrap", flexDirection: "row", height: tagsExpanded ? "100%" : 37, justifyContent: "flex-start"}} style={{overflow: "hidden" }}>
          {selectedTags.map((t,i) => {return (<Chip key={t.name} sx={{margin: "5px 5px", fontWeight: 'bold'}} label={t.name} color={t.selected? "success" : "default"} clickable onClick={() => handleChipSelection(t)} onDelete={t.selected? () => handleChipDelete(t) : undefined}/>)})}
        </Box>
        <Box sx={{display: "flex", alignItems: "flex-start", position: "relative"}}>
          {!tagsExpanded && isOverflown && <Tooltip enterTouchDelay={1} placement="top" title={<Box component="p" sx={{ color: "text.primary", fontSize: "16px" }}>Click for more tags</Box>}><ExpandMoreIcon onClick={() => setTagsExpanded(true)}/></Tooltip>}
          { tagsExpanded && isOverflown && <Tooltip enterTouchDelay={1} placement="top" title={<Box component="p" sx={{ color: "text.primary", fontSize: "16px" }}>Click for less tags</Box>}><ExpandLessIcon onClick={() => setTagsExpanded(false)}/></Tooltip>}
        </Box>
      </Box>
    </Box>
    )

  const fuse = new Fuse(Object.values(models), options)

  const tagsArray = selectedTags.filter(e => e.selected == true).map(e => e.name);
  const result = ((searchValue === "") ? Object.values(models).map(e => {return {item: e}}) : fuse.search(searchValue)).filter((e,i) => {
    if(tagsArray.length == 0) return true;
    return tagsArray.every(tag => e.item.tags.includes(tag))
  });

  return (
    <>
        <Typography className={styles.text}>
          This Repository is a curated collection of glTF models that illustrate one or more features or capabilities of glTF.
          The glTF Sample Model Repository is designed to showcase and test the capabilities of the glTF 2.0 format.
          Whether you&apos;re a developer, designer, educator, or toolmaker, this resource offers categorized access to a wide range of models used in tutorials, testing tools, and public demonstrations. 
          Each model includes a screenshot, description, license info, and live preview aimed at helping you explore, evaluate, and integrate glTF more effectively.
        </Typography>

        <Typography className={styles.text}>
          All models are tagged to allow easier access. 
          You can select the model you would like to view, use the tags or search to filter the list. 
        </Typography>

        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          <Box sx={{display: 'flex', width: "100%", flexDirection: 'row', justifyContent: "space-between", alignItems: 'center'}}>
            <Search searchValueChange={handleSearchValueChange}/>
            <Tooltip enterTouchDelay={1} placement="right" title={<Box component="p" sx={{ color: "text.primary", fontSize: "16px" }}>Search in the description and the titles of the models. Tags can be used to further segment the search</Box>}>
              <HelpIcon sx={{margin: "5px"}}/>
            </Tooltip>
            <Box sx={{flex: 1, display: { xs: 'flex', sm: 'flex' }, justifyContent: 'flex-end', flexWrap: "wrap"}}>
            </Box>
          </Box>
          {otherChips}
        </Box>

        

        {/* Models */}
        <Grid container style={{padding: 0, margin: 0}} spacing={1} sx={{ justifyContent: "center"}}>
        {result.map((e,i) => { return <ModelCard key={e.item.name} name={e.item.name} title={e.item.label} thumbnail={e.item.thumbnail} />})}
        </Grid>     
    </>
  );
}

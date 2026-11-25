"use client"
import React from 'react'
import Script from 'next/script'
import { Box, Button, IconButton, Paper, FormControlLabel, Switch, Typography, Select, FormControl, InputLabel, MenuItem, CircularProgress, ToggleButtonGroup, ToggleButton } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import normalizeWheel from 'normalize-wheel';
import { basePath } from '@/lib/paths';

interface FullscreenCanvas extends HTMLCanvasElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export type Stats = {
  totalImagesFileSize: number
  numberOfVertices: number
  numberOfFaces: number,
  totalFileSize: number,
  fileFormat?: string
}

export type LivePreviewSampleRendererProps = {
  src: string,
  imgSrc: string,
  variants: Record<string, string>,
  statsCallback: (stats: Stats) => void
}

const orbit = {
  prev_mouse: [0,0],
  curr_mouse: [0,0],
  old_touch_dist: 0,

  deltaPhi: 0,
  deltaTheta: 0,
  deltaZoom: 0,
  deltaX: 0,
  deltaY: 0
}

const handleMouseDown = (ev: React.MouseEvent<HTMLCanvasElement>) => {

  if(ev.buttons === 1 && ev.shiftKey === false)
  {
    orbit.prev_mouse[0] = ev.pageX;
    orbit.prev_mouse[1] = ev.pageY;

    orbit.curr_mouse[0] = ev.pageX;
    orbit.curr_mouse[1] = ev.pageY;
  }  
  else if(ev.buttons === 4)
  {
    orbit.prev_mouse[0] = ev.pageX;
    orbit.prev_mouse[1] = ev.pageY;

    orbit.curr_mouse[0] = ev.pageX;
    orbit.curr_mouse[1] = ev.pageY;
  }
  ev.preventDefault();
}

const handleMouseMove = (ev: React.MouseEvent<HTMLCanvasElement>) => {

  if(ev.buttons === 1)
  {
    orbit.curr_mouse[0] = ev.pageX;
    orbit.curr_mouse[1] = ev.pageY;

    orbit.deltaPhi = orbit.curr_mouse[0] - orbit.prev_mouse[0];
    orbit.deltaTheta = orbit.curr_mouse[1] - orbit.prev_mouse[1];

    orbit.prev_mouse[0] = ev.pageX;
    orbit.prev_mouse[1] = ev.pageY;    
  } 
  if(ev.buttons === 4) 
  {
    orbit.curr_mouse[0] = ev.pageX;
    orbit.curr_mouse[1] = ev.pageY;

    orbit.deltaX = orbit.curr_mouse[0] - orbit.prev_mouse[0];
    orbit.deltaY = orbit.curr_mouse[1] - orbit.prev_mouse[1];

    orbit.prev_mouse[0] = ev.pageX;
    orbit.prev_mouse[1] = ev.pageY; 
  }
  ev.preventDefault();
}

const handleMouseUp = (ev: React.MouseEvent<HTMLCanvasElement>) => {

  if(ev.buttons === 1 && ev.shiftKey === false)
  {
    orbit.deltaPhi = 0;
    orbit.deltaTheta = 0;
    orbit.deltaZoom = 0;
    orbit.deltaX = 0;
    orbit.deltaY = 0;
  }  
  ev.preventDefault(); 
}
const handleMouseWheel = (ev: WheelEvent) => {
  orbit.deltaZoom = normalizeWheel(ev).spinY;//ev.deltaY;
  ev.preventDefault();
}

const handleTouchStart = (ev: TouchEvent) => {
  if(ev.touches.length === 2)
  {
    const distVec = [ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY];
    const dist = Math.sqrt(distVec[0] * distVec[0] + distVec[1] * distVec[1]);
    orbit.old_touch_dist = dist;
  }
  else if(ev.touches.length == 1)
  {
    orbit.curr_mouse[0] = ev.touches[0].clientX;
    orbit.curr_mouse[1] = ev.touches[0].clientY;

    orbit.prev_mouse[0] = ev.touches[0].clientX;
    orbit.prev_mouse[1] = ev.touches[0].clientY;
  }

}
const handleTouchMove = (ev: TouchEvent) => {
  if(ev.touches.length === 2)
  {
    const distVec = [ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY];
    const dist = Math.sqrt(distVec[0] * distVec[0] + distVec[1] * distVec[1]);
    orbit.deltaZoom = 0.1 * (orbit.old_touch_dist - dist);
    orbit.old_touch_dist = dist;
  }
  else if(ev.touches.length == 1)
  {
    orbit.curr_mouse[0] = ev.touches[0].clientX;
    orbit.curr_mouse[1] = ev.touches[0].clientY;

    orbit.deltaPhi = 0.5 * (orbit.curr_mouse[0] - orbit.prev_mouse[0]);
    orbit.deltaTheta = 0.5 * (orbit.curr_mouse[1] - orbit.prev_mouse[1]);

    orbit.prev_mouse[0] = ev.touches[0].clientX;
    orbit.prev_mouse[1] = ev.touches[0].clientY;
  }
}

const handleTouchEnd = (ev: TouchEvent) => {
  orbit.deltaPhi = 0;
  orbit.deltaTheta = 0;
  orbit.deltaZoom = 0;
  orbit.deltaX = 0;
  orbit.deltaY = 0;
}

const available_extensions = { 
  KHR_materials_anisotropy: true, 
  KHR_materials_clearcoat: true, 
  KHR_materials_diffuse_transmission: true, 
  KHR_materials_dispersion: true, 
  KHR_materials_emissive_strength: true, 
  KHR_materials_ior: true, 
  KHR_materials_iridescence: true,
  KHR_materials_sheen: true,
  KHR_materials_specular: true, 
  KHR_materials_transmission: true, 
  KHR_materials_volume: true
};
const supported_extensions = new Map([ 
  ["KHR_materials_anisotropy", true], 
  ["KHR_materials_clearcoat", true],
  ["KHR_materials_diffuse_transmission", true],
  ["KHR_materials_dispersion", true],
  ["KHR_materials_emissive_strength", true],
  ["KHR_materials_ior", true],
  ["KHR_materials_iridescence", true],
  ["KHR_materials_sheen", true],
  ["KHR_materials_specular", true],
  ["KHR_materials_transmission", true],
  ["KHR_materials_volume", true]
]);
const debugOptions = ['None', "Base Color", "Metallic", "Roughness", 'Occlusion', 'Shading Normal', 'Wireframe'];

let active_debugOutput = "None";
let active_animations = [0] as number[];
const active_extensions = new Map<string, boolean>(supported_extensions);
let active_variant = "glTF-Binary";
let change_variant = false;
let active_materialVariant = "default";
let current_update_func_id = 0;
let webgl2_wireframe_extensions : WEBGL_polygon_mode | null = null;

interface WEBGL_polygon_mode {
  LINE_WEBGL: number,
  FILL_WEBGL: number,

  polygonModeWEBGL: (face: number, mode: number) => void;
}

const loadBlob = async (src: string) => {
  return fetch(src)
  .then(response => { 
    if(!response.ok) 
      throw new Error(`${response.status} ${src}`); 
    return response.blob(); 
  })
  .then(blob => { return blob.size; })
  .catch(err => { return 0; });
}

export default function LivePreviewSampleRenderer({src, imgSrc, variants, statsCallback}: LivePreviewSampleRendererProps) {

  const [dracoLoaded, setDracoLoaded] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);
  const [debugOutput, setDebugOutput] = React.useState("None");
  const [extensions, setExtensions] = React.useState(new Map<string, boolean>());
  const [animations, setAnimations] = React.useState<Array<string>>([]);
  const [selectedAnimation, setSelectedAnimation] = React.useState("");
  const [modelVariants, setModelVariants] = React.useState(src.endsWith(".glb") ? 'glTF-Binary' : 'glTF');
  const [materialVariants, setMaterialVariants] = React.useState<Array<string>>([]);
  const [selectedMaterialVariant, setSelectedMaterialVariant] = React.useState("default");
  const [isModelLoaded, setIsModelLoaded] = React.useState(false);
  const [hasWireframeExtensions, setHasWireframeExtension] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const canvasContainerWrapperRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const toggleExtension = (extension: string, value: boolean) => {
    setExtensions(prev => {const ext = new Map(prev); ext.set(extension, value); return ext; })
    active_extensions.set(extension, value);
  }

  const toggleAnimation = (animation_name: string | null) =>
  {
    if(animation_name === null)
    {
      active_animations = [];
      setSelectedAnimation("");
      return;
    }
    setSelectedAnimation(animation_name);
    const index = animations.indexOf(animation_name)
    if(index >= 0)
      active_animations = [index];
    else
      console.warn("Error", animation_name);
  }

  const requestFullScreen = () => {
    const canvas = canvasRef.current as FullscreenCanvas;
    if (canvas) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
      } else if (canvas.mozRequestFullScreen) {
        canvas.mozRequestFullScreen();
      } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
      }
    }
  };

  React.useEffect(() => {
    active_debugOutput = debugOutput;
  }, [debugOutput])

  React.useEffect(() => {
    active_variant = modelVariants;
  }, [modelVariants]);

  React.useEffect(() => {
    
    if(!dracoLoaded)
      return;

    if(canvasRef == null || canvasRef.current == null) { return; }
    const canvas = canvasRef.current;
    const webGl2Context = canvas.getContext('webgl2') as WebGL2RenderingContext;

    // Is the wireframe extension supported?
    webgl2_wireframe_extensions = webGl2Context.getExtension("WEBGL_polygon_mode") as WEBGL_polygon_mode;
    setHasWireframeExtension(webgl2_wireframe_extensions !== null);

    const load = async () => {

      const {GltfView, GltfState} = await import('@khronosgroup/gltf-viewer/dist/gltf-viewer.module.js');
      const view = new GltfView(webGl2Context);

      // Polygon mode is global GL state: draw the fullscreen tonemap quad filled even in wireframe mode.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderer = (view as any).renderer;
      const origTonemapPass = renderer.tonemapPass.bind(renderer);
      renderer.tonemapPass = (...args: unknown[]) => {
        const ext = webgl2_wireframe_extensions;
        if(ext)
          ext.polygonModeWEBGL(webGl2Context.FRONT_AND_BACK, ext.FILL_WEBGL);
        origTonemapPass(...args);
        if(ext && active_debugOutput == 'Wireframe')
          ext.polygonModeWEBGL(webGl2Context.FRONT_AND_BACK, ext.LINE_WEBGL);
      };

      const state = view.createState();
      state.sceneIndex = 0;
      state.animationIndices = [0, 1, 2];
      state.animationTimer.start();

      const resourceLoader = view.createResourceLoader();
      state.gltf = await resourceLoader.loadGltf(src);

      // KHR_materials_variants: names come from the loaded glTF, "default" means the base materials.
      const refreshMaterialVariants = (gltf: typeof state.gltf) => {
        const names: string[] = gltf.extensions?.KHR_materials_variants?.variants?.map((v: { name: string }) => v.name) ?? [];
        active_materialVariant = "default";
        setMaterialVariants(names);
        setSelectedMaterialVariant("default");
      };
      refreshMaterialVariants(state.gltf);

      const animation_names = [] as string[];
      for(const animation of state.gltf.animations)
      {
        animation_names.push(animation.name?? "Animate");
      }
      setAnimations(animation_names);
      if(animation_names.length > 0)
        setSelectedAnimation(animation_names[0]);
      if(state.gltf.extensionsUsed)
      {
        const extension_names = new Map<string, boolean>();
        for(const extension of state.gltf.extensionsUsed)
        {
          if(supported_extensions.has(extension))
          {
            extension_names.set(extension as string, true);
          }
        }
        setExtensions(extension_names);
      }
      
      const customGatherStatistics = async (state: InstanceType<typeof GltfState>, view: InstanceType<typeof GltfView>, assetSource: string, fileVariant: string) : Promise<Stats> => {

        const viewerStats = view.gatherStatistics(state);

        // gather information from the active scene
        const scene = state.gltf.scenes[state.sceneIndex];
        if (scene === undefined)
        {
            return {
              totalImagesFileSize: 0,
              numberOfVertices: 0,
              numberOfFaces: 0,
              totalFileSize: 0,
            };
        }

        const imagesFileSizes = [];
        for(let i = 0; i < state.gltf.images.length; i++)
        {
          if(state.gltf.images[i].image.src)
            imagesFileSizes.push(loadBlob(state.gltf.images[i].image.src));
        }
        const imagesFileSize = (await Promise.all(imagesFileSizes)).reduce((acc: number, curr: number) => acc + curr, 0);
        const srcFileSize = await loadBlob(assetSource);
        let externalBuffersFileSize = 0;
        for(const buffer of state.gltf.buffers)
        {
          if(buffer.uri && buffer.uri.length > 0 && !buffer.uri.startsWith("data:"))
          {
            externalBuffersFileSize += buffer.byteLength;
          }
        }
        const externalImagesFileSizePromises = [];
        for(const image of state.gltf.images)
        {
          if(image.uri && image.uri.length > 0 && !image.uri.startsWith("data:"))
            externalImagesFileSizePromises.push(loadBlob(image.uri));
        }
        const externalImagesFileSize = (await Promise.all(externalImagesFileSizePromises)).reduce((acc: number, curr: number) => acc + curr, 0);
        const totalFileSize = srcFileSize + externalBuffersFileSize + externalImagesFileSize;

        // Face and Triangle count. Copied code from gltf-sample-renderer
        let numberOfVertices = 0;
        const { nodes } = scene.gatherNodes(state.gltf, state.renderingParameters.enabledExtensions);
        const uniqueAccessors = new Set<number>();
        for(const node of nodes)
        {
          const activeMesh = node.mesh !== undefined && state.gltf.meshes[node.mesh];
          if(activeMesh)
          {
            for(const primitive of activeMesh.primitives)
            {
              if(primitive !== undefined)
              {
                let vertexCount = 0;
                if (primitive.indices !== undefined) {
                    vertexCount = state.gltf.accessors[primitive.indices].count;
                    uniqueAccessors.add(primitive.indices);
                }
                else {
                    vertexCount = state.gltf.accessors[primitive.attributes["POSITION"]].count;
                    uniqueAccessors.add(primitive.attributes["POSITION"]);
                }
                if (vertexCount === 0) {
                    continue;
                }            
              }
            }
          }
        }
        for(const accessor of uniqueAccessors)
        {
          numberOfVertices += state.gltf.accessors[accessor].count;
        }
        
        return {
          totalImagesFileSize: imagesFileSize,
          numberOfVertices: numberOfVertices,
          numberOfFaces: (viewerStats as {faceCount: number}).faceCount,
          totalFileSize: totalFileSize,
          fileFormat: fileVariant
        }
      };
      customGatherStatistics(state, view, src, active_variant).then(res => { statsCallback(res); });
      
      await resourceLoader.loadEnvironment(`https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Environments/low_resolution_hdrs/Cannon_Exterior.hdr`, {
         lut_ggx_file: `${basePath}/assets/lut_ggx.png`, 
         lut_charlie_file: `${basePath}/assets/lut_charlie.png`,
         lut_sheen_E_file: `${basePath}/assets/lut_sheen_E.png`
      }).then((environment: typeof state.environment) => {
        state.environment = environment;
      })
      //state.renderingParameters.iblIntensity = Math.pow(10, 0.1/*intensity*/);
      state.sceneIndex = state.gltf.scene === undefined ? 0 : state.gltf.scene;
      const scene = state.gltf.scenes[state.sceneIndex];
      scene.applyTransformHierarchy(state.gltf);
      state.userCamera.perspective.aspectRatio = canvas.width / canvas.height;
      state.userCamera.resetView(state.gltf, state.sceneIndex);
      state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
      state.userCamera.orbitSpeed = Math.max(10.0 / canvas.width, 10.0 / canvas.height);
      state.userCamera.panSpeed *= 5;

      state.renderingParameters.debugOutput = debugOutput;
      setIsModelLoaded(true);
      const defaultToneMap = state.renderingParameters.toneMap;
      const defaultRenderEnvironmentMap = state.renderingParameters.renderEnvironmentMap;
      const update = () =>
      {
        if(change_variant)
        {
          resourceLoader.loadGltf(variants[active_variant])
            .then((res: typeof state.gltf) => { console.log("Reload gltf"); state.gltf = res; refreshMaterialVariants(res);})
            .then(() => {return customGatherStatistics(state, view, variants[active_variant], active_variant)})
            .then((res: Stats) => { statsCallback(res); setIsModelLoaded(true);});          
          change_variant = false;
        }
        // Rendering Properties
        if(active_debugOutput == 'Wireframe')
        {
          if(webgl2_wireframe_extensions)
            webgl2_wireframe_extensions.polygonModeWEBGL(webGl2Context.FRONT_AND_BACK, webgl2_wireframe_extensions.LINE_WEBGL);
          state.renderingParameters.debugOutput = 'Base Color';
          state.renderingParameters.toneMap = GltfState.ToneMaps.NONE;
          state.renderingParameters.renderEnvironmentMap = false;
        }
        else
        {
          if(webgl2_wireframe_extensions)
            webgl2_wireframe_extensions.polygonModeWEBGL(webGl2Context.FRONT_AND_BACK, webgl2_wireframe_extensions.FILL_WEBGL);
          state.renderingParameters.debugOutput = active_debugOutput;
          state.renderingParameters.toneMap = defaultToneMap;
          state.renderingParameters.renderEnvironmentMap = defaultRenderEnvironmentMap;
        }
        state.variant = active_materialVariant;
        state.animationIndices = active_animations;
        active_extensions.forEach((value, key) => {
          if (key in state.renderingParameters.enabledExtensions) {
            state.renderingParameters.enabledExtensions[key as keyof typeof state.renderingParameters.enabledExtensions] = value;
          }
        });

        // Camera Properties
        state.userCamera.orbit(orbit.deltaPhi, orbit.deltaTheta);
        if(orbit.deltaZoom)
          state.userCamera.zoomBy(orbit.deltaZoom);
        if(orbit.deltaX !== 0 || orbit.deltaY !== 0)
          state.userCamera.pan(orbit.deltaX, -orbit.deltaY);
        orbit.deltaPhi = 0;
        orbit.deltaTheta = 0;
        orbit.deltaZoom = 0;
        orbit.deltaX = 0;
        orbit.deltaY = 0;
        view.renderFrame(state, canvas.width, canvas.height);
        current_update_func_id = window.requestAnimationFrame(update);
      };
      window.requestAnimationFrame(update);
    };
    load();
  }, [src, dracoLoaded])

  React.useEffect(() => {
    if(canvasRef == null || canvasRef.current == null) { return; }
    if(canvasContainerRef == null || canvasContainerRef.current == null) { return; }
    if(canvasContainerWrapperRef == null || canvasContainerWrapperRef.current == null) { return; }
    
    const canvas = canvasRef.current;
    const canvasContainer = canvasContainerRef.current;
    const canvasContainerWrapper = canvasContainerWrapperRef.current;

    const processImages = async () => {
      
      const toolResize = () => {
        if (canvasContainer.clientWidth == 0 || canvasContainer.clientHeight == 0) return;
                   
        // Calculate new dimensions 
        const width = document.fullscreenElement !== null? window.innerWidth : canvasContainer.clientWidth;
        const height = document.fullscreenElement !== null? window.innerHeight : canvasContainer.clientHeight;

        if(document.fullscreenElement == null)
        {
          //canvasContainerWrapper.style.width = `${width}px`;
          canvasContainerWrapper.style.height = `${height}px`;
        }
  
        canvas.width = width;
        canvas.height = height;
        //canvas.style.width = `${width}px`;
        //canvas.style.height = `${height}px`;
      };

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          toolResize();
        });
      });
        
      // Observe the canvas
      resizeObserver.observe(document.body);

      return resizeObserver;
    }

    const resizeObserverPromise = processImages();

    return () => {resizeObserverPromise.then(res => {res.disconnect()})}
  }, [imgSrc]);

  React.useEffect(() => {
    const isDracoLoaded = !!document.querySelector('script[src="https://www.gstatic.com/draco/v1/decoders/draco_decoder_gltf.js"]')
    setDracoLoaded(isDracoLoaded);

    const canvas = canvasRef.current;
    if(canvas)
    {
      canvas.addEventListener('wheel', handleMouseWheel, { passive: false });
      canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => { 
      window.cancelAnimationFrame(current_update_func_id);
      if(canvas)
      {
        canvas.removeEventListener('wheel', handleMouseWheel);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [])
  
    return (
      <Box ref={canvasContainerRef}>
        <Script src="https://www.gstatic.com/draco/v1/decoders/draco_decoder_gltf.js" strategy="afterInteractive" onLoad={() => { console.log("LOADED Draco"); setDracoLoaded(true);}} onReady={() => { console.log("READY Draco");}} />
        <Box ref={canvasContainerWrapperRef} sx={{textAlign: "center", margin: "auto", position: 'relative', minHeight: '50vh'}}>
          <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} style={{display: isModelLoaded? 'block' : 'none', touchAction: 'none', overscrollBehavior: 'contain', width: '100%'}}/>
          <img ref={imgRef} src={imgSrc} style={{display: isModelLoaded? 'none' : 'block', backgroundColor: 'transparent', position: 'absolute', left: 0, top: 0, zIndex: 10, objectFit: 'cover', width:"100%", height:'100%'}} alt="Asset Preview"/>
          {!isModelLoaded && <Box sx={{position: 'absolute', left: 0, top: 'calc(50% - 0.5 * 5rem)', width: '100%', zIndex: 20}}>
            <CircularProgress color="primary" size={'5rem'}/>
          </Box>}

          {/* Button in bottom left */}
          {isModelLoaded && <Box sx={{position: "absolute", bottom: {sm: 20, xs: 10}, left: {sm: 20, xs: 10}, zIndex: 10}}>
            <IconButton aria-label="Show/Hide Asset Inspector" color="default" onClick={() => setShowOptions(!showOptions)} sx={{ backgroundColor: '#212121', color: 'white', '&:hover': { backgroundColor: 'gray', }, width: 32, height: 32, borderRadius: '50%', }}>
              <MenuIcon />
            </IconButton>
          </Box>}
          {/* Button in bottom right */}
          {isModelLoaded && <Box sx={{position: "absolute", bottom: {sm: 20, xs: 10}, right: {sm: 20, xs: 10}, zIndex: 10}}>
            <IconButton aria-label="Fullscreen Button" color="default" onClick={() => requestFullScreen()} sx={{ backgroundColor: "#212121", color: 'white', '&:hover': { backgroundColor: 'gray', }, width: 32, height: 32, borderRadius: '50%', }}>
              <FullscreenIcon />
            </IconButton>
          </Box>}
          {/* Floating options window */}
          {showOptions && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                bottom: 70,
                left: 10,
                zIndex: 9,
                p: 1,
                width: 200,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start', // ← This is key
                maxHeight: '50vh'
              }}
              
            >
              <Typography variant="h6">Inspection</Typography>
              <Box sx={{display: extensions.size>0? 'flex':'none', flexDirection: 'column', alignItems: 'flex-start', width: '100%', overflowWrap:"anywhere", overflowY:'scroll', overflowX:'hidden'}} >
                <Typography variant="subtitle2" gutterBottom>
                  Extensions
                </Typography>
                { Array.from(extensions).map(([extName, extValue]) => (
                  <FormControlLabel
                    key={extName}
                    control={
                      <Switch
                        checked={extValue}
                        onChange={(ev, checked) => toggleExtension(extName, checked)}
                      />
                    }
                    label={extName.replace("KHR_materials_", "")}
                    sx={{
                      '.MuiFormControlLabel-label': {
                        textAlign: 'left',
                      },
                    }}
                  />
                ))}
              </Box>

              <Box sx={{display: animations.length>0? 'flex':'none', flexDirection: 'column', alignItems: 'flex-start', mb: 1, mt: 2, width: '100%'}}>
                <Typography variant="subtitle1" gutterBottom>
                  Animations:
                </Typography>
                
                <ToggleButtonGroup value={selectedAnimation} exclusive orientation='vertical' fullWidth onChange={(event: React.MouseEvent<HTMLElement>, newValue: string | null) => toggleAnimation(newValue)} sx={{width: '100%'}}>
                  {animations.map((anim) => (
                    <ToggleButton
                      key={anim}
                      sx={{ textTransform: 'none', overflowWrap:"anywhere", width: '100%' }}
                      value={anim}
                      aria-label={`Enable ${anim}`}
                    >
                      {anim}
                    </ToggleButton>
                  ))}

                </ToggleButtonGroup>
                
              </Box>
              <Box sx={{width: '100%', mt: 2}}>
                <FormControl fullWidth size="small">
                  <InputLabel id="debug-output-label">Debug Visualization</InputLabel>
                  <Select
                    labelId="debug-output-label"
                    value={debugOutput}
                    label="Debug Visualization"
                    onChange={(e) => { setDebugOutput(e.target.value)}}
                    MenuProps={{
                      disableScrollLock: true, // disables body padding-right
                    }}
                  >
                    {debugOptions.filter(opt => opt !== 'Wireframe' || (opt === 'Wireframe' && hasWireframeExtensions)).map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{display: materialVariants.length>0? 'block':'none', width: '100%', mt: 2}}>
                <FormControl fullWidth size="small">
                  <InputLabel id="material-variants-label">Material Variants</InputLabel>
                  <Select
                    labelId="material-variants-label"
                    value={selectedMaterialVariant}
                    label="Material Variants"
                    onChange={(e) => { active_materialVariant = e.target.value; setSelectedMaterialVariant(e.target.value); }}
                    MenuProps={{
                      disableScrollLock: true, // disables body padding-right
                    }}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    {materialVariants.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{width: '100%', mt: 2}}>
                <FormControl fullWidth size="small">
                  <InputLabel id="variants-label">Format Variants</InputLabel>
                  <Select
                    labelId="variants-label"
                    value={modelVariants}
                    label="Format Variants"
                    onChange={(e) => { active_variant = e.target.value; change_variant = true; setIsModelLoaded(false); setShowOptions(false); setModelVariants(e.target.value)}}
                    MenuProps={{
                      disableScrollLock: true, // disables body padding-right
                    }}
                  >
                    {Object.keys(variants).map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    );
};

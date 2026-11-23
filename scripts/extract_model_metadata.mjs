import fs from 'fs';
import path from 'path';

async function* getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    //const res = path.resolve(dir, dirent.name);
    const res = path.join(dir, dirent.name);
    
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

const RenderFidelityMap = await fetch("https://raw.githubusercontent.com/KhronosGroup/glTF-Render-Fidelity/refs/heads/main/src/data/model-index.Fidelity.json").then(res => res.json()).catch(e => {return {}});
//const ModelList = await fetch("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/model-index.json").then(res => res.json()).catch(e => {return []});
const ModelList = JSON.parse(await fs.promises.readFile(`./glTF-Sample-Assets/Models/model-index.json`, 'utf-8'));
const CameraProperties = JSON.parse(await fs.promises.readFile(`./src/data/camera-props.SampleAssets.json`, 'utf-8'));
const ModelKeywords = JSON.parse(await fs.promises.readFile(`./src/data/keywords.SampleAssets.json`, 'utf-8'));
const ModelTags = {};
const ModelMap = {};
ModelList.forEach(item => {
  ModelMap[item.name] = item;
});
const OutputModelMap = {};

//const model_directory = await fetch("https://api.github.com/repos/KhronosGroup/glTF-Sample-Assets/contents/Models").then(res => res.json()).catch(e => {return []});
const model_directory = await fs.promises.readdir("./glTF-Sample-Assets/Models", { withFileTypes: true });
const image_directory = '/images';

console.log("Dir #:", Object.keys(model_directory).length);

const keep_dict = {
  "showcase": "Showcase",
  "testing": "Testing",
  "extension": "Extension",
}

const ext_to_label = {
  "KHR_materials_transmission": "Transmission",
  "KHR_materials_volume": "Volume",
  "KHR_materials_variants": "Variants",
  "KHR_materials_clearcoat": "Clearcoat",
  "KHR_materials_sheen": "Sheen",
  "KHR_materials_specular": "Specular",
  "KHR_materials_ior": "IOR",
  "KHR_materials_iridescence": "Iridescence",
  "KHR_materials_pbrSpecularGlossiness": "pbrSpecularGlossiness",
  "KHR_materials_emissive_strength": "Emissive",
  "KHR_materials_anisotropy": "Anisotropy",
  "KHR_materials_unlit": "Unlit",
  "KHR_lights_punctual": "Lights",
  "KHR_texture_transform": "Texture Transform",
  "KHR_xmp": "XMP",
  "KHR_xmp_json_ld": "XMP JSON LD",
  "EXT_texture_webp": "WebP",
  "KHR_materials_dispersion": "Dispersion",
  "KHR_materials_volume_scatter": "Volume Scatter",
  "KHR_materials_scatter": "Scatter",
  "EXT_mesh_gpu_instancing": "Mesh GPU Instancing",
  "KHR_materials_diffuse_transmission": "Diffuse Transmission",
  "KHR_animation_pointer": "Animation Pointer",  
  "KHR_node_visibility": "Node Visibility",  
  "KHR_materials_retroreflection": "Retroreflection",
  "KHR_meshopt_compression": "Meshopt",
  "KHR_mesh_quantization": "Quantization"
};

const addTag = (tagMap, tag) => {
  if (tag in tagMap) {
    tagMap[tag]++;
  } else {
    tagMap[tag] = 1;
  }
};

await (async () => {
  for await (const dir of model_directory.filter((e,i) => i<99999)) {
    if(!dir.isDirectory()) continue;

    const name = dir.name;
    const folderpath = `Models/${name}`;
    console.log("Model", name);

    const model = ModelMap[name];
    if(model == null) 
    {
      console.log("Cannot find ", name)
      continue;
    }
    
    let metadata = null;
    let gltf = null;
    try {
      metadata = JSON.parse(await fs.promises.readFile(`./glTF-Sample-Assets/${folderpath}/metadata.json`, 'utf-8'));
      gltf = JSON.parse(await fs.promises.readFile(`./glTF-Sample-Assets/${folderpath}/glTF/${name}.gltf`, 'utf-8'));
    }
    catch(e)
    {
      console.log(e);
      continue;
    }
    
    const gltf_file = model && model.variants && model.variants['glTF'];
    const glb = model && model.variants && model.variants['glTF-Binary'];
    const glb_draco = model && model.variants && Object.keys(model.variants).find(variant => variant.includes('Draco'));
    const glb_quantized = model && model.variants && Object.keys(model.variants).find(variant => variant.includes('Quantized'));
    const glb_ktx = model && model.variants && Object.keys(model.variants).find(variant => variant.includes('KTX'));
    const screenshot = model && model.screenshot && `/glTF-Sample-Assets/${folderpath}/${model.screenshot}`;

    if(model && metadata && screenshot)
    {
      const name = encodeURIComponent(metadata.name.replace(/\s+/g, ''));
      OutputModelMap[name] = {};
      OutputModelMap[name].name = metadata.name.replace(/\s+/g, '');
      OutputModelMap[name].folder = dir.name;
      OutputModelMap[name].label = metadata.name;
      OutputModelMap[name].description = metadata.summary;
      OutputModelMap[name].tags = [];
      for (const tag of metadata.tags.filter(tag => tag in keep_dict)) {
        OutputModelMap[name].tags.push(keep_dict[tag]);
        addTag(ModelTags, keep_dict[tag]);
      }
      OutputModelMap[name].variants = model && model.variants;
      OutputModelMap[name].extensionsUsed = gltf? gltf.extensionsUsed : [];
      if(gltf && gltf.extensionsUsed) {
        for (const tag of OutputModelMap[name].extensionsUsed) {
          if(tag in ext_to_label)
          {
            addTag(ModelTags, ext_to_label[tag]);
            OutputModelMap[name].tags.push(ext_to_label[tag]);
          }
          else
          {
            console.log(`Warning: Need to add a short name for ${tag}`);
          }          
        }
      }
      let anim_found =false;
      let morph_found = false;
      if(gltf && gltf.animations) {
        addTag(ModelTags, "Animation");
        OutputModelMap[name].tags.push("Animation");
        anim_found = true;
      }
      if(gltf && gltf.meshes) {
          for (const mesh of gltf.meshes) {
          if ("weights" in mesh && !anim_found) {
            addTag(ModelTags, "Animation");
            OutputModelMap[name].tags.push("Animation");
            anim_found = true;
          }
          for (const prim of mesh.primitives) {
            if ("targets" in prim && !morph_found) {
              addTag(ModelTags, "Morphing");
              OutputModelMap[name].tags.push("Morphing");
              morph_found = true;
              if (!anim_found) {
                addTag(ModelTags, "Animation");
                OutputModelMap[name].tags.push("Animation");
                anim_found = true;
              }
            }
          }
        }
      }
      if(glb_draco) {
        const tag = "Draco";
        addTag(ModelTags, tag);
        OutputModelMap[name].tags.push(tag);
      }
      if(glb_quantized) {
        const tag = "Meshopt";
        addTag(ModelTags, tag);
        OutputModelMap[name].tags.push(tag);
      }
      if(glb_ktx) {
        const tag = "KTX";
        addTag(ModelTags, tag);
        OutputModelMap[name].tags.push(tag);
      }
      if(!(gltf && gltf.extensionsUsed) &&
         !glb_ktx &&
         !glb_quantized &&
         !glb_draco) {
        const tag = "Core"; 
        addTag(ModelTags, tag);
        OutputModelMap[name].tags.push(tag);
      }

      OutputModelMap[name].downloadModel = glb? `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/${folderpath}/glTF-Binary/${glb}` : undefined
      OutputModelMap[name].gltfModel = gltf_file? `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/${folderpath}/glTF/${gltf_file}` : undefined

      for(let variant_name of Object.keys(OutputModelMap[name].variants))
      {
        OutputModelMap[name].variants[variant_name] = `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/${folderpath}/${variant_name}/${OutputModelMap[name].variants[variant_name]}`;
      }
      
      OutputModelMap[name].image = `/images/${name}.webp`;
      OutputModelMap[name].thumbnail = `/images/${name}.webp`;      

      OutputModelMap[name].camera = {
        yaw: (CameraProperties[name] && CameraProperties[name].yaw) ?? 0,
        pitch: (CameraProperties[name] && CameraProperties[name].pitch) ?? 0,
        distance: (CameraProperties[name] && CameraProperties[name].distance) ?? 0,
      }

      OutputModelMap[name].keywords = "";
      OutputModelMap[name].license = [];
      OutputModelMap[name].authors = [];
      if(metadata.legal)
      {
        OutputModelMap[name].license = metadata.legal.filter(e => e.icon && e.icon.length > 0).map(e => {return {license: e.license, url: e.licenseUrl, icon: e.icon}});
        OutputModelMap[name].authors = metadata.legal.filter(e => e.icon && e.icon.length > 0).map(e => e.artist);
        if(OutputModelMap[name].authors.length === 0)
          OutputModelMap[name].authors = metadata.legal.filter(e => e.artist && e.artist.length > 0).map(e => e.artist);
      }

      if(ModelKeywords[name])
      {
        OutputModelMap[name].keywords = ModelKeywords[name].keywords;
      }
      OutputModelMap[name].isOnRenderFidelity = name in RenderFidelityMap;

      OutputModelMap[name].keywords += (gltf && gltf.animations && gltf.animations.length > 0)? ", Animated" : "";
    }   
  }
})();

console.log('ModelTags', ModelTags);

const TagList = {tags: []};
for (const tag in ModelTags) {
  TagList.tags.push(tag);
}

const jsonData = JSON.stringify(
    Object.fromEntries(Object.entries(OutputModelMap).sort()),
    null,
    2
);
fs.writeFileSync('src/data/model-index.SampleAssets.json', jsonData);

const jsonDataTagList = JSON.stringify(TagList, null, 2); // The `null, 2` makes the output pretty-printed
fs.writeFileSync('src/data/tags.json', jsonDataTagList);
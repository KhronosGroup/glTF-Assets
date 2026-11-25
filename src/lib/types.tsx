export type ModelType = {
  name: string,
  folder: string,  
  label: string,
  description: string,
  tags: Array<string>,
  gltfModel: string,
  dracoModel?: string,
  ktxModel?: string,
  quantizedModel?: string,
  downloadModel?: string,
  image: string,
  thumbnail: string
  authors: Array<string>
  license: Array<{license: string, url:string, icon:string}>
  variants: Record<string, string>,
  keywords: string,
  isOnRenderFidelity: boolean
};
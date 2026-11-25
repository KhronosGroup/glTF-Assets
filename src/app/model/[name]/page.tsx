import React from 'react'
import type { Metadata, ResolvingMetadata  } from 'next'
import ModelPage from "@/components/Pages/ModelPage";
import models from "@/data/model-index.SampleAssets.json"
import { baseUrl } from '@/lib/paths';
import { ModelType } from '@/lib/types';
import styles from "../../page.module.css";

export const dynamicParams = false; // models that are not included in the list, generate 404

export async function generateStaticParams() {
    
    return Object.values(models).map((model) => ({
      name: model.name
    }))
}

// Next.js 16 passes decoded route params (e.g. "BoxTexturednot2^N"), while some
// keys in the model index are URL-encoded (e.g. "BoxTexturednot2%5EN").
function getModel(name: string): ModelType {
  const index = models as Record<string, ModelType>;
  return index[name] ?? index[encodeURIComponent(name)] ?? Object.values(index).find(m => m.name === name);
}

type Props = {
  params: Promise<{ name: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata( { params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const {name} = await params;
 
  // fetch data
  const model = getModel(name);
 
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []
 
  return {
    metadataBase: new URL(baseUrl),
    title: model.label,
    description: model.description,
    openGraph: {
      title: model.label,
      description: model.description,
      images: [model.thumbnail, ...previousImages],
    },
    robots: {
      index: false,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: false,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  }
}

export default async function Page({params}: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  const model = getModel(name);

  const tags = new Set(model.tags);
  const modelList = Object.values(models as Record<string, ModelType>).map(m => { 
    return {...m, score: m.tags.filter(label => tags.has(label)).length } as ModelType & { score: number};
  });  

  const showcaseList = modelList.filter(m => m.name !== name && m.tags.includes("Showcase")).sort((a, b) => {
    return b.score - a.score;
  });

  const showcaseModels : Array<ModelType> = showcaseList.slice(0, 3);
  const showcaseNames = new Set(showcaseModels.map(m => m.name));

  const relevantList = modelList
  .filter(m => m.name !== name && !showcaseNames.has(m.name))
  .sort((a, b) => {
    return b.score - a.score;
  });
  const suggestedModels : Array<ModelType> = relevantList.slice(0, 6);
  
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ModelPage name={name} label={model.label} description={model.description} tags={model.tags} image={model.image} modelURL={model.downloadModel || model.gltfModel} downloadUrl={model.downloadModel} model={model} showcaseModels={showcaseModels} suggestedModels={suggestedModels}/>
      </main>
    </div>)
}
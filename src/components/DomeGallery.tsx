import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

interface GalleryImage {
  src: string;
  alt?: string;
}

interface DomeGalleryProps {
  images?: (string | GalleryImage)[];
  fit?: number;
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
  autoRotateSpeed?: number;
}

const DEFAULT_IMAGES: GalleryImage[] = [
  // Roads & Infrastructure — India
  { src: 'https://images.pexels.com/photos/35662660/pexels-photo-35662660.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'JCB backhoe and tractor at roadside construction in India' },
  { src: 'https://images.pexels.com/photos/16577231/pexels-photo-16577231.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Urban decay and reconstruction efforts in Puri, India' },
  { src: 'https://images.pexels.com/photos/10133569/pexels-photo-10133569.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Person walking on cracked urban street' },
  { src: 'https://images.pexels.com/photos/12221672/pexels-photo-12221672.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Bustling Mumbai street with autorickshaws and pedestrians' },
  { src: 'https://images.pexels.com/photos/8407917/pexels-photo-8407917.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Wet road in New Delhi with car driving away on cloudy day' },
  { src: 'https://images.pexels.com/photos/19764951/pexels-photo-19764951.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Lively street in Mumbai with scooters and old buildings' },
  { src: 'https://images.pexels.com/photos/36867768/pexels-photo-36867768.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Street scene in Kolkata with lush trees and minimal traffic' },
  { src: 'https://images.pexels.com/photos/37934901/pexels-photo-37934901.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Busy street scene in Ludhiana, Punjab with cars and people' },
  { src: 'https://images.pexels.com/photos/4428283/pexels-photo-4428283.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Woman in saree on busy street in Goa, India amidst traffic' },
  { src: 'https://images.pexels.com/photos/5688465/pexels-photo-5688465.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Cracks and potholes on aged asphalt road' },
  { src: 'https://images.pexels.com/photos/9963247/pexels-photo-9963247.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Cracked asphalt road with visible repair patches' },

  // Water & Drainage — India (Kolkata, Delhi monsoon flooding)
  { src: 'https://images.pexels.com/photos/26202091/pexels-photo-26202091.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Cars navigate flooded street in Kolkata during heavy rain' },
  { src: 'https://images.pexels.com/photos/21617984/pexels-photo-21617984.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Flooded Kolkata street with rickshaw and pedestrian' },
  { src: 'https://images.pexels.com/photos/21960689/pexels-photo-21960689.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Flooded street scene in Kolkata with vehicles and people' },
  { src: 'https://images.pexels.com/photos/17609960/pexels-photo-17609960.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Rickshaw navigates flooded street in New Delhi during monsoon' },
  { src: 'https://images.pexels.com/photos/30309542/pexels-photo-30309542.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Motorcyclist rides through waterlogged streets in Kolkata' },
  { src: 'https://images.pexels.com/photos/25189241/pexels-photo-25189241.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Kolkata street flooded after heavy monsoon rains' },
  { src: 'https://images.pexels.com/photos/27567485/pexels-photo-27567485.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Motorcyclists ride through flooded street in Kolkata' },
  { src: 'https://images.pexels.com/photos/21617983/pexels-photo-21617983.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Car driving through flooded street in Kolkata' },
  { src: 'https://images.pexels.com/photos/21960706/pexels-photo-21960706.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Car navigates flooded street in Kolkata' },
  { src: 'https://images.pexels.com/photos/21961065/pexels-photo-21961065.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Motorcyclist rides through flooded street in Kolkata' },
  { src: 'https://images.pexels.com/photos/24797143/pexels-photo-24797143.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Blue car drives through flooded streets in Kolkata' },
  { src: 'https://images.pexels.com/photos/23939154/pexels-photo-23939154.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Motorcyclists navigate through flooded street in Kolkata' },
  { src: 'https://images.pexels.com/photos/21617980/pexels-photo-21617980.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Heavy rain floods Kolkata streets with bikes and rickshaws' },
  { src: 'https://images.pexels.com/photos/26146700/pexels-photo-26146700.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Yellow taxi battles flooding on streets in Kolkata' },
  { src: 'https://images.pexels.com/photos/38521937/pexels-photo-38521937.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Man and child cycling through flooded street in Kolkata' },

  // Waste & Sanitation — India
  { src: 'https://images.pexels.com/photos/2570304/pexels-photo-2570304.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Man collects trash in urban setting in Noida, India' },
  { src: 'https://images.pexels.com/photos/14430163/pexels-photo-14430163.png?auto=compress&cs=tinysrgb&w=800', alt: 'Piles of garbage bags stacked in outdoor waste disposal area' },
  { src: 'https://images.pexels.com/photos/2382894/pexels-photo-2382894.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Trash-filled streets with urban buildings in South Asia' },
  { src: 'https://images.pexels.com/photos/8800289/pexels-photo-8800289.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Discarded textile bags in a recycling pile — waste management' },
  { src: 'https://images.pexels.com/photos/15528024/pexels-photo-15528024.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Busy alleyway in Mumbai with stacked bags and urban life' },
  { src: 'https://images.pexels.com/photos/6777374/pexels-photo-6777374.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Trolley with trash in dirty alley between old buildings' },
  { src: 'https://images.pexels.com/photos/5789369/pexels-photo-5789369.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Black trash bags stacked in front of urban graffiti' },
  { src: 'https://images.pexels.com/photos/36040842/pexels-photo-36040842.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Broken plastic container with scattered debris — urban waste' },
  { src: 'https://images.pexels.com/photos/13537446/pexels-photo-13537446.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Pile of mixed waste at sprawling urban landfill' },
  { src: 'https://images.pexels.com/photos/6316243/pexels-photo-6316243.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Overflowing bins and garbage in urban parking lot' },

  // Street Lighting — India
  { src: 'https://images.pexels.com/photos/5209703/pexels-photo-5209703.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Quiet New Delhi street at night illuminated by streetlights' },
  { src: 'https://images.pexels.com/photos/14665061/pexels-photo-14665061.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Silhouetted figures walking under streetlights in Ratnagiri, India' },
  { src: 'https://images.pexels.com/photos/29720899/pexels-photo-29720899.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Foggy night scene with yellow road barriers and streetlights' },
  { src: 'https://images.pexels.com/photos/19426552/pexels-photo-19426552.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Person silhouette at night on street in Kolkata with buses' },
  { src: 'https://images.pexels.com/photos/16101562/pexels-photo-16101562.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Nighttime city street with illuminated path and moving truck' },

  // Public Safety — India
  { src: 'https://images.pexels.com/photos/4496624/pexels-photo-4496624.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police officer in uniform near patrol car in Uttar Pradesh' },
  { src: 'https://images.pexels.com/photos/26971842/pexels-photo-26971842.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Four policemen standing on street in Mumbai, India' },
  { src: 'https://images.pexels.com/photos/36076854/pexels-photo-36076854.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police officers on horseback patrolling urban area in India' },
  { src: 'https://images.pexels.com/photos/13062241/pexels-photo-13062241.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police officer using radio while driving patrol car in India' },
  { src: 'https://images.pexels.com/photos/13062239/pexels-photo-13062239.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Indian police officer with arms crossed by patrol car' },
  { src: 'https://images.pexels.com/photos/9245871/pexels-photo-9245871.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police officer shoulder insignia in India' },
  { src: 'https://images.pexels.com/photos/4891762/pexels-photo-4891762.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Indian police officer in uniform with sunglasses outdoors' },
  { src: 'https://images.pexels.com/photos/13062242/pexels-photo-13062242.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police officer communicates via radio while driving patrol vehicle' },
  { src: 'https://images.pexels.com/photos/13062234/pexels-photo-13062234.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police officer standing beside patrol car with radio in India' },
  { src: 'https://images.pexels.com/photos/13268079/pexels-photo-13268079.png?auto=compress&cs=tinysrgb&w=800', alt: 'Two police officers ride motorcycle in city traffic' },
  { src: 'https://images.pexels.com/photos/12582990/pexels-photo-12582990.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police and citizens at crowded outdoor scene in India' },
  { src: 'https://images.pexels.com/photos/4267620/pexels-photo-4267620.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Police car patrols under city lights at night in Uttar Pradesh' },

  // Parks & Green Spaces — India
  { src: 'https://images.pexels.com/photos/37886179/pexels-photo-37886179.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Garden pathway along waterfront with cityscape view in India' },
  { src: 'https://images.pexels.com/photos/33610939/pexels-photo-33610939.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'People enjoying sunny day in park with green trees and pond' },
  { src: 'https://images.pexels.com/photos/19921803/pexels-photo-19921803.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Peaceful park in New Delhi during sunset with silhouettes' },
  { src: 'https://images.pexels.com/photos/30574621/pexels-photo-30574621.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Gardener tending plants by fountain in New Delhi park' },
  { src: 'https://images.pexels.com/photos/14031239/pexels-photo-14031239.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Shish Gumbad Tomb in Lodi Gardens, New Delhi, India' },
  { src: 'https://images.pexels.com/photos/39306755/pexels-photo-39306755.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Tree-lined road in Raipur, India with lush environment' },
  { src: 'https://images.pexels.com/photos/37810853/pexels-photo-37810853.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Sundar Nursery with symmetrical garden layout in New Delhi' },
  { src: 'https://images.pexels.com/photos/28003470/pexels-photo-28003470.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Victoria Memorial in Kolkata with people enjoying landscape' },
  { src: 'https://images.pexels.com/photos/36569229/pexels-photo-36569229.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'People at Victoria Memorial in Kolkata with blooming trees' },
  { src: 'https://images.pexels.com/photos/21617959/pexels-photo-21617959.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Victoria Memorial surrounded by lush gardens in Kolkata' },
  { src: 'https://images.pexels.com/photos/12931519/pexels-photo-12931519.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Leafless tree in urban park in New Delhi, India' },
  { src: 'https://images.pexels.com/photos/35488382/pexels-photo-35488382.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Modern park with outdoor chess set and lush greenery in India' },
  { src: 'https://images.pexels.com/photos/19903911/pexels-photo-19903911.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Historic fort surrounded by trees and grass in India' },

  // Traffic & Transport — India
  { src: 'https://images.pexels.com/photos/27374365/pexels-photo-27374365.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Crowded city street with cars, motorcycles, and buses in India' },
  { src: 'https://images.pexels.com/photos/10692618/pexels-photo-10692618.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Crowded street with cars, bikes, and auto rickshaws in India' },
  { src: 'https://images.pexels.com/photos/5323957/pexels-photo-5323957.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Overhead view of traffic jam in Hyderabad, India' },
  { src: 'https://images.pexels.com/photos/30169645/pexels-photo-30169645.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Heavy traffic on busy Bengaluru street' },
  { src: 'https://images.pexels.com/photos/36997696/pexels-photo-36997696.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Chaotic traffic in Bengaluru with auto rickshaws and cars' },
  { src: 'https://images.pexels.com/photos/2574077/pexels-photo-2574077.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Busy road with trucks and cars in heavy traffic in India' },
  { src: 'https://images.pexels.com/photos/17340970/pexels-photo-17340970.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'City street in India with vehicles under smoggy skies' },
  { src: 'https://images.pexels.com/photos/28865962/pexels-photo-28865962.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Congested city road bustling with vehicles in India' },
  { src: 'https://images.pexels.com/photos/22408022/pexels-photo-22408022.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Aerial traffic congestion on Mumbai road' },
  { src: 'https://images.pexels.com/photos/29848581/pexels-photo-29848581.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Traffic congestion in Bengaluru, India' },
  { src: 'https://images.pexels.com/photos/20395359/pexels-photo-20395359.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Vehicles on expressway in New Delhi during golden hour' },

  // Urban Poverty / Slum — India
  { src: 'https://images.pexels.com/photos/30801668/pexels-photo-30801668.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Child in the slums of Lucknow, India' },
  { src: 'https://images.pexels.com/photos/11091106/pexels-photo-11091106.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Two adults resting on street with belongings in India' },
  { src: 'https://images.pexels.com/photos/28432040/pexels-photo-28432040.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Street view in Mumbai with bustling market and colorful homes' },
  { src: 'https://images.pexels.com/photos/28672608/pexels-photo-28672608.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Street scene in Mumbai with auto rickshaws and buildings' },
  { src: 'https://images.pexels.com/photos/28672606/pexels-photo-28672606.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Aerial view of slum area alongside railway tracks in Mumbai' },
  { src: 'https://images.pexels.com/photos/6450839/pexels-photo-6450839.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Man in urban slum using smartphone amidst garbage in Delhi' },
  { src: 'https://images.pexels.com/photos/33986172/pexels-photo-33986172.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Children in New Delhi alley carrying water bucket' },
  { src: 'https://images.pexels.com/photos/10822937/pexels-photo-10822937.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Aerial view of rooftops with satellite dishes in urban India' },
  { src: 'https://images.pexels.com/photos/10742870/pexels-photo-10742870.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Street vendor arranges jewelry on roadside stall in Indore' },

  // Construction & Urban Development — India
  { src: 'https://images.pexels.com/photos/33638024/pexels-photo-33638024.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Construction on misty road in Uttarakhand, India during monsoon' },
  { src: 'https://images.pexels.com/photos/17935041/pexels-photo-17935041.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Yellow industrial trucks on misty road in Kedarnath, India' },
  { src: 'https://images.pexels.com/photos/30401740/pexels-photo-30401740.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Yellow bulldozer amidst construction in Mumbai, India' },

  // Accessibility & Disability — Wheelchair / Mobility
  { src: 'https://images.pexels.com/photos/9808741/pexels-photo-9808741.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Metal handrail and concrete ramp for accessibility' },
  { src: 'https://images.pexels.com/photos/9856780/pexels-photo-9856780.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Painted wheelchair symbol indicating accessibility' },
  { src: 'https://images.pexels.com/photos/11597470/pexels-photo-11597470.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Person in wheelchair navigating stairs with handrail' },
  { src: 'https://images.pexels.com/photos/11597472/pexels-photo-11597472.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Individual in wheelchair on stairs using handrail' },
  { src: 'https://images.pexels.com/photos/8415494/pexels-photo-8415494.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Young man in wheelchair facing steps in city setting' },
  { src: 'https://images.pexels.com/photos/11074307/pexels-photo-11074307.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Weathered handicap sign painted on pavement' },
  { src: 'https://images.pexels.com/photos/8415496/pexels-photo-8415496.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Young man in wheelchair facing staircase outdoors' },
  { src: 'https://images.pexels.com/photos/11074318/pexels-photo-11074318.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Yellow wheelchair symbol painted on asphalt' },
  { src: 'https://images.pexels.com/photos/5577662/pexels-photo-5577662.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Wheelchair accessible parking symbol on asphalt' },
  { src: 'https://images.pexels.com/photos/16435185/pexels-photo-16435185.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'No parking and handicap signs on weathered wall' },

  // Accessibility & Disability — Visual Impairment / Braille / Tactile
  { src: 'https://images.pexels.com/photos/7265425/pexels-photo-7265425.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Hands using slate and stylus to write Braille' },
  { src: 'https://images.pexels.com/photos/7188783/pexels-photo-7188783.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Braille text embossed on paper with light and shadow' },
  { src: 'https://images.pexels.com/photos/32887963/pexels-photo-32887963.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Tactile guiding blocks for accessibility at train station' },
  { src: 'https://images.pexels.com/photos/7188771/pexels-photo-7188771.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Hand feeling and reading Braille text on paper' },
  { src: 'https://images.pexels.com/photos/6607478/pexels-photo-6607478.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Embossed Braille text for accessibility' },
  { src: 'https://images.pexels.com/photos/7188725/pexels-photo-7188725.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Blind person walking on tactile paving with cane' },
  { src: 'https://images.pexels.com/photos/7188601/pexels-photo-7188601.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Hands feeling Braille text on paper — tactile reading' },
  { src: 'https://images.pexels.com/photos/7188566/pexels-photo-7188566.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Hand touching a Braille book — tactile reading' },
  { src: 'https://images.pexels.com/photos/7695388/pexels-photo-7695388.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Hands reading Braille text on paper — inclusivity concept' },
  { src: 'https://images.pexels.com/photos/7188743/pexels-photo-7188743.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Green braille slate and stylus on textured paper' },
];

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number): number => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

interface ItemCoord {
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  src: string;
  alt: string | undefined;
}

function buildItems(pool: (string | GalleryImage)[], seg: number): ItemCoord[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map((c) => ({ ...c, src: '', alt: '' }));
  }

  const normalizedImages: GalleryImage[] = pool.map((image) => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: image.src || '', alt: image.alt || '' };
  });

  const maxPerImage = 2;
  const maxImages = normalizedImages.length * maxPerImage;
  const usedImages: GalleryImage[] = [];

  if (maxImages >= totalSlots) {
    let idx = 0;
    for (let i = 0; i < totalSlots; i++) {
      usedImages.push(normalizedImages[idx]);
      idx = (idx + 1) % normalizedImages.length;
    }
  } else {
    for (let i = 0; i < totalSlots; i++) {
      usedImages.push(normalizedImages[i % normalizedImages.length]);
    }
  }

  // Interleave: sort by a hash of src so categories are scattered around the globe
  const interleave = [...usedImages];
  interleave.sort((a, b) => {
    const ha = a.src.split('/').pop() || a.src;
    const hb = b.src.split('/').pop() || b.src;
    return ha < hb ? -1 : ha > hb ? 1 : 0;
  });
  interleave.forEach((img, i) => { usedImages[i] = img; });

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
  }));
}

function computeItemBaseRotation(
  offsetX: number,
  offsetY: number,
  sizeX: number,
  sizeY: number,
  segments: number
) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery({
  images = DEFAULT_IMAGES,
  fit = 0.5,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = '#120F17',
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth = '400px',
  openedImageHeight = '400px',
  imageBorderRadius = '30px',
  openedImageBorderRadius = '30px',
  grayscale = true,
  autoRotateSpeed = 0,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const focusedElRef = useRef<HTMLDivElement | null>(null);
  const originalTilePositionRef = useRef<DOMRect | null>(null);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);

  const scrollLockedRef = useRef(false);
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return;
    scrollLockedRef.current = true;
    document.body.classList.add('dg-scroll-lock');
  }, []);
  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return;
    if (rootRef.current?.getAttribute('data-enlarging') === 'true') return;
    scrollLockedRef.current = false;
    document.body.classList.remove('dg-scroll-lock');
  }, []);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  };

  const lockedRadiusRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width),
        h = Math.max(1, cr.height);
      const minDim = Math.min(w, h),
        maxDim = Math.max(w, h),
        aspect = w / h;
      let basis: number;
      switch (fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = basis * fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, minRadius, maxRadius);
      lockedRadiusRef.current = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`);
      root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
      applyTransform(rotationRef.current.x, rotationRef.current.y);

      const enlargedOverlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement | null;
      if (enlargedOverlay && frameRef.current && mainRef.current) {
        const frameR = frameRef.current.getBoundingClientRect();
        const mainR = mainRef.current.getBoundingClientRect();

        const hasCustomSize = openedImageWidth && openedImageHeight;
        if (hasCustomSize) {
          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`;
          document.body.appendChild(tempDiv);
          const tempRect = tempDiv.getBoundingClientRect();
          document.body.removeChild(tempDiv);

          const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2;

          enlargedOverlay.style.left = `${centeredLeft}px`;
          enlargedOverlay.style.top = `${centeredTop}px`;
        } else {
          enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
          enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
          enlargedOverlay.style.width = `${frameR.width}px`;
          enlargedOverlay.style.height = `${frameR.height}px`;
        }
      }
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [
    fit,
    fitBasis,
    minRadius,
    maxRadius,
    padFactor,
    overlayBlurColor,
    grayscale,
    imageBorderRadius,
    openedImageBorderRadius,
    openedImageWidth,
    openedImageHeight,
  ]);

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
  }, []);

  useEffect(() => {
    if (autoRotateSpeed <= 0) return;
    let rafId: number | null = null;
    let lastTime = performance.now();
    const step = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const nextY = wrapAngleSigned(rotationRef.current.y + autoRotateSpeed * delta * 60);
      rotationRef.current = { x: rotationRef.current.x, y: nextY };
      applyTransform(rotationRef.current.x, nextY);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [autoRotateSpeed]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;
      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null;
          return;
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null;
          return;
        }
        const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return;
        stopInertia();
        const evt = event as PointerEvent;
        draggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: evt.clientX, y: evt.clientY };
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;
        const evt = event as PointerEvent;
        const dxTotal = evt.clientX - startPosRef.current.x;
        const dyTotal = evt.clientY - startPosRef.current.y;
        if (!movedRef.current) {
          const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
          if (dist2 > 16) movedRef.current = true;
        }
        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg
        );
        const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);
        if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }
        if (last) {
          draggingRef.current = false;
          let [vMagX, vMagY] = velocity;
          const [dirX, dirY] = direction;
          let vx = vMagX * dirX;
          let vy = vMagY * dirY;
          if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement;
            vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
            vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
          }
          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      },
    },
    { target: mainRef, eventOptions: { passive: true } }
  );

  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current;
      if (!el) return;
      const parent = el.parentElement!;
      const overlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement | null;
      if (!overlay) return;
      const refDiv = parent.querySelector('.item__image--reference');
      const originalPos = originalTilePositionRef.current;
      if (!originalPos) {
        overlay.remove();
        if (refDiv) refDiv.remove();
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        el.style.visibility = '';
        el.style.zIndex = '0';
        focusedElRef.current = null;
        rootRef.current?.removeAttribute('data-enlarging');
        openingRef.current = false;
        unlockScroll();
        return;
      }
      const currentRect = overlay.getBoundingClientRect();
      const rootRect = rootRef.current!.getBoundingClientRect();
      const originalPosRelativeToRoot = {
        left: originalPos.left - rootRect.left,
        top: originalPos.top - rootRect.top,
        width: originalPos.width,
        height: originalPos.height,
      };
      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height,
      };
      const animatingOverlay = document.createElement('div');
      animatingOverlay.className = 'enlarge-closing';
      animatingOverlay.style.cssText = `position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;
      const originalImg = overlay.querySelector('img');
      if (originalImg) {
        const img = originalImg.cloneNode() as HTMLImageElement;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        animatingOverlay.appendChild(img);
      }
      overlay.remove();
      rootRef.current!.appendChild(animatingOverlay);
      void animatingOverlay.getBoundingClientRect();
      requestAnimationFrame(() => {
        animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
        animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
        animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
        animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
        animatingOverlay.style.opacity = '0';
      });
      const cleanup = () => {
        animatingOverlay.remove();
        originalTilePositionRef.current = null;
        if (refDiv) refDiv.remove();
        parent.style.transition = 'none';
        el.style.transition = 'none';
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        requestAnimationFrame(() => {
          el.style.visibility = '';
          el.style.opacity = '0';
          el.style.zIndex = '0';
          focusedElRef.current = null;
          rootRef.current?.removeAttribute('data-enlarging');
          requestAnimationFrame(() => {
            parent.style.transition = '';
            el.style.transition = 'opacity 300ms ease-out';
            requestAnimationFrame(() => {
              el.style.opacity = '1';
              setTimeout(() => {
                el.style.transition = '';
                el.style.opacity = '';
                openingRef.current = false;
                if (!draggingRef.current && rootRef.current?.getAttribute('data-enlarging') !== 'true')
                  document.body.classList.remove('dg-scroll-lock');
              }, 300);
            });
          });
        });
      };
      animatingOverlay.addEventListener('transitionend', cleanup, { once: true });
    };
    scrim.addEventListener('click', close);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      scrim.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [enlargeTransitionMs, unlockScroll]);

  const openItemFromElement = useCallback(
    (el: HTMLDivElement) => {
      if (openingRef.current) return;
      openingRef.current = true;
      openStartedAtRef.current = performance.now();
      lockScroll();
      const parent = el.parentElement!;
      focusedElRef.current = el;
      el.setAttribute('data-focused', 'true');
      const offsetX = getDataNumber(parent, 'offsetX', 0);
      const offsetY = getDataNumber(parent, 'offsetY', 0);
      const sizeX = getDataNumber(parent, 'sizeX', 2);
      const sizeY = getDataNumber(parent, 'sizeY', 2);
      const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
      const parentY = normalizeAngle(parentRot.rotateY);
      const globalY = normalizeAngle(rotationRef.current.y);
      let rotY = -(parentY + globalY) % 360;
      if (rotY < -180) rotY += 360;
      const rotX = -parentRot.rotateX - rotationRef.current.x;
      parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
      parent.style.setProperty('--rot-x-delta', `${rotX}deg`);
      const refDiv = document.createElement('div');
      refDiv.className = 'item__image item__image--reference';
      refDiv.style.opacity = '0';
      refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
      parent.appendChild(refDiv);

      void refDiv.offsetHeight;

      const tileR = refDiv.getBoundingClientRect();
      const mainR = mainRef.current?.getBoundingClientRect();
      const frameR = frameRef.current?.getBoundingClientRect();

      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        openingRef.current = false;
        focusedElRef.current = null;
        parent.removeChild(refDiv);
        unlockScroll();
        return;
      }

      originalTilePositionRef.current = tileR;
      el.style.visibility = 'hidden';
      el.style.zIndex = '0';
      const overlay = document.createElement('div');
      overlay.className = 'enlarge';
      overlay.style.position = 'absolute';
      overlay.style.left = frameR.left - mainR.left + 'px';
      overlay.style.top = frameR.top - mainR.top + 'px';
      overlay.style.width = frameR.width + 'px';
      overlay.style.height = frameR.height + 'px';
      overlay.style.opacity = '0';
      overlay.style.zIndex = '30';
      overlay.style.willChange = 'transform, opacity';
      overlay.style.transformOrigin = 'top left';
      overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;
      const rawSrc = parent.dataset.src || el.querySelector('img')?.src || '';
      const img = document.createElement('img');
      img.src = rawSrc;
      overlay.appendChild(img);
      viewerRef.current!.appendChild(overlay);
      const tx0 = tileR.left - frameR.left;
      const ty0 = tileR.top - frameR.top;
      const sx0 = tileR.width / frameR.width;
      const sy0 = tileR.height / frameR.height;

      const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
      const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

      overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;

      setTimeout(() => {
        if (!overlay.parentElement) return;
        overlay.style.opacity = '1';
        overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
        rootRef.current?.setAttribute('data-enlarging', 'true');
      }, 16);

      const wantsResize = openedImageWidth || openedImageHeight;
      if (wantsResize) {
        const onFirstEnd = (ev: TransitionEvent) => {
          if (ev.propertyName !== 'transform') return;
          overlay.removeEventListener('transitionend', onFirstEnd);
          const prevTransition = overlay.style.transition;
          overlay.style.transition = 'none';
          const tempWidth = openedImageWidth || `${frameR.width}px`;
          const tempHeight = openedImageHeight || `${frameR.height}px`;
          overlay.style.width = tempWidth;
          overlay.style.height = tempHeight;
          const newRect = overlay.getBoundingClientRect();
          overlay.style.width = frameR.width + 'px';
          overlay.style.height = frameR.height + 'px';
          void overlay.offsetWidth;
          overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
          const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
          requestAnimationFrame(() => {
            overlay.style.left = `${centeredLeft}px`;
            overlay.style.top = `${centeredTop}px`;
            overlay.style.width = tempWidth;
            overlay.style.height = tempHeight;
          });
          const cleanupSecond = () => {
            overlay.removeEventListener('transitionend', cleanupSecond);
            overlay.style.transition = prevTransition;
          };
          overlay.addEventListener('transitionend', cleanupSecond, { once: true });
        };
        overlay.addEventListener('transitionend', onFirstEnd);
      }
    },
    [enlargeTransitionMs, lockScroll, openedImageHeight, openedImageWidth, segments, unlockScroll]
  );

  const onTileClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  const onTilePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'touch') return;
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  useEffect(() => {
    return () => {
      document.body.classList.remove('dg-scroll-lock');
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="sphere-root"
      style={
        {
          ['--segments-x']: segments,
          ['--segments-y']: segments,
          ['--overlay-blur-color']: overlayBlurColor,
          ['--tile-radius']: imageBorderRadius,
          ['--enlarge-radius']: openedImageBorderRadius,
          ['--image-filter']: grayscale ? 'grayscale(1)' : 'none',
        } as React.CSSProperties
      }
    >
      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div
                key={`${it.x},${it.y},${i}`}
                className="item"
                data-src={it.src}
                data-offset-x={it.x}
                data-offset-y={it.y}
                data-size-x={it.sizeX}
                data-size-y={it.sizeY}
                style={
                  {
                    ['--offset-x']: it.x,
                    ['--offset-y']: it.y,
                    ['--item-size-x']: it.sizeX,
                    ['--item-size-y']: it.sizeY,
                  } as React.CSSProperties
                }
              >
                <div
                  className="item__image"
                  role="button"
                  tabIndex={0}
                  aria-label={it.alt || 'Open image'}
                  onClick={onTileClick}
                  onPointerUp={onTilePointerUp}
                >
                  <img src={it.src} draggable={false} alt={it.alt} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />

        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  );
}

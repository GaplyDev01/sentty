// This file contains global type definitions

// Declare modules for importing CSS
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Declare modules for various libraries if needed
declare module 'swiper/react' {
  import { ReactElement, Component } from 'react';
  import { SwiperOptions } from 'swiper';
  
  export interface SwiperProps extends SwiperOptions {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  export class Swiper extends Component<SwiperProps> {}
  export class SwiperSlide extends Component<{ children?: React.ReactNode, className?: string, key?: any, [key: string]: any }> {}
}

declare module 'swiper/modules' {
  export const Navigation: any;
  export const Pagination: any;
  export const EffectCoverflow: any;
  export const Autoplay: any;
}

declare module 'swiper/css' {}
declare module 'swiper/css/pagination' {}
declare module 'swiper/css/navigation' {}
declare module 'swiper/css/effect-coverflow' {}
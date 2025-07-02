declare module 'react-material-ui-carousel' {
  import * as React from 'react';
  interface CarouselProps {
    autoPlay?: boolean;
    navButtonsAlwaysVisible?: boolean;
    [key: string]: any;
  }
  const Carousel: React.FC<CarouselProps>;
  export default Carousel;
} 
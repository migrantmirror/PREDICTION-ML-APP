// components/ui/slider.tsx
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = ({ className, ...props }: SliderPrimitive.SliderProps) => (
  <SliderPrimitive.Root
    className={cn("relative flex items-center w-full", className)}
    {...props}
  >
    <SliderPrimitive.Track className="bg-gray-200 relative flex-grow h-2 rounded-full">
      <SliderPrimitive.Range className="absolute h-full bg-blue-500 rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block w-4 h-4 bg-white border border-blue-500 rounded-full shadow-sm" />
  </SliderPrimitive.Root>
);

export { Slider };

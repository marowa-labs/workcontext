import "react-router";
module "virtual:load-fonts.jsx" {
  export function LoadFonts(): null;
}
declare module "react-router" {
  interface AppLoadContext {
    // add context properties here
  }
}
declare module "npm:stripe" {
  import Stripe from "stripe";
  export default Stripe;
}

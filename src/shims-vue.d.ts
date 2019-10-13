declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

declare module '*.rs' {
    const x: any;
    export = x;
}
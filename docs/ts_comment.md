# TypeScript Comment Standards

This is an overview of how comments and JSDoc is used in this project.

This applies to TS and TSX files.
</br></br>


## File Overview

This goes at the top of each TS file.
</br></br>


```ts
/**
 * @fileoverview <A summary of the file's contents>
 * 
 * @remarks
 * Any additional comments about the file
 * 
 * @exports <Exports>
 */
```
</br></br>


## Types

A description of a type that has been defined.

Not much needs to be included here, as this is implicit in the type itself.
</br></br>


```ts
/**
 * @template <name>
 * @summary <Description of the type>
 * @remarks
 * Any additional comments needed to explain the type
 * 
 * @property {<type>} <name> - <Description>
 */
```
</br></br>


## Functions

```ts
/**
 * @function <Function Name>
 * @summary <brief outline>
 * @remarks
 * <Any additional comments required to explain the function>
 * 
 * @param {<Parameter>} - <Description of the parameter>
 * 
 * @returns {<Return>} - <A description of the return>
 */
```
</br></br>


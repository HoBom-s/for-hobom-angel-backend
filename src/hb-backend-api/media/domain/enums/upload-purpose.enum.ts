/**
 * Where an upload belongs. Selects the object-key prefix so storage lifecycle
 * rules and CDN cache rules can be scoped per area.
 */
export enum UploadPurpose {
  ANIMAL = "ANIMAL",
  SHELTER = "SHELTER",
  USER = "USER",
}

import type { Model } from 'mongoose';
import supabaseToolSchema, { type ISupabaseToolDocument } from '../schema/supabaseTool';

/**
 * Creates the SupabaseTool model
 */
export function createSupabaseToolModel(
  mongoose: typeof import('mongoose'),
): Model<ISupabaseToolDocument> {
  try {
    // Check if model already exists
    return mongoose.model<ISupabaseToolDocument>('SupabaseTool');
  } catch (error) {
    // Model doesn't exist, create it
    return mongoose.model<ISupabaseToolDocument>(
      'SupabaseTool',
      supabaseToolSchema,
      'supabase_tools',
    );
  }
}

export default createSupabaseToolModel;

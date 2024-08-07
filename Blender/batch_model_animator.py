bl_info = {
    "name": "Batch Model Animator",
    "blender": (2, 80, 0),
    "category": "Object",
}

import bpy
import os

class BatchModelAnimatorProperties(bpy.types.PropertyGroup):
    animated_model_file: bpy.props.StringProperty(
        name="Animated Model File",
        description="Path to the animated model file",
        subtype='FILE_PATH'
    )
    model_files: bpy.props.CollectionProperty(
        name="Model Files",
        description="List of model files to process",
        type=bpy.types.PropertyGroup
    )
    output_dir: bpy.props.StringProperty(
        name="Output Directory",
        description="Directory to save processed files",
        subtype='DIR_PATH'
    )
    model_files_index: bpy.props.IntProperty(
        name="Model Files Index",
        default=0
    )

class BatchModelAnimator(bpy.types.Operator):
    """Batch process multiple model files, aligning their positions and animations to an animated model, and export processed models"""
    bl_idname = "object.batch_model_animator"
    bl_label = "Batch Model Animator"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        props = context.scene.batch_model_animator
        animated_model_file = props.animated_model_file
        model_files = [item.name for item in props.model_files]
        output_dir = props.output_dir

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)

        bpy.ops.import_scene.gltf(filepath=animated_model_file)
        animated_objects = [obj for obj in bpy.context.selected_objects]

        def find_armature(objects):
            for obj in objects:
                if obj.type == 'ARMATURE':
                    return obj
            return None

        animated_armature = find_armature(animated_objects)

        if not animated_armature or not animated_armature.animation_data:
            self.report({'ERROR'}, "The animated model does not have an armature or animation data")
            return {'CANCELLED'}

        animations = [action for action in bpy.data.actions]

        for model_file in model_files:
            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.object.delete(use_global=False)

            bpy.ops.import_scene.fbx(filepath=model_file)
            imported_objects = [obj for obj in bpy.context.selected_objects]

            model_armature = find_armature(imported_objects)

            if model_armature:
                bpy.ops.import_scene.gltf(filepath=animated_model_file)
                animated_objects = [obj for obj in bpy.context.selected_objects]
                animated_armature = find_armature(animated_objects)
                if not animated_armature:
                    self.report({'ERROR'}, "Failed to re-import the animated model's armature")
                    return {'CANCELLED'}

                model_armature.location = animated_armature.location

                for animation in animations:
                    model_armature.animation_data_create()
                    model_armature.animation_data.action = animation

                    bpy.context.view_layer.update()
                    bpy.context.view_layer.objects.active = model_armature
                    bpy.ops.object.mode_set(mode='OBJECT')
                    model_armature.location = (0, 0, 0)

                    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
                    # model_armature.rotation_euler[0] += 3.14159
                    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

                    if bpy.context.scene.camera:
                        bpy.context.scene.camera.location = animated_armature.location
                        bpy.context.scene.camera.rotation_euler = animated_armature.rotation_euler

                    base_name = os.path.basename(model_file)
                    name, ext = os.path.splitext(base_name)
                    output_file = os.path.join(output_dir, f"{name}_{animation.name}{ext}")

                    bpy.ops.object.select_all(action='DESELECT')
                    for obj in imported_objects:
                        obj.select_set(True)
                    bpy.ops.export_scene.fbx(filepath=output_file, use_selection=True)
            else:
                self.report({'ERROR'}, f"Failed to find armature in model {model_file}")

        return {'FINISHED'}

class BatchModelAnimatorPanel(bpy.types.Panel):
    """Creates a Panel in the Object properties window"""
    bl_label = "Batch Model Animator"
    bl_idname = "OBJECT_PT_batch_model_animator"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Tool'

    def draw(self, context):
        layout = self.layout

        scene = context.scene
        animator = scene.batch_model_animator

        layout.prop(animator, "animated_model_file")
        layout.template_list("UI_UL_list", "model_files", animator, "model_files", animator, "model_files_index")
        layout.operator("object.batch_model_animator_add", icon='ADD')
        layout.operator("object.batch_model_animator_remove", icon='REMOVE')
        layout.prop(animator, "output_dir")
        layout.operator("object.batch_model_animator")

class BatchModelAnimatorAdd(bpy.types.Operator):
    bl_idname = "object.batch_model_animator_add"
    bl_label = "Add Model File"
    filepath: bpy.props.StringProperty(subtype="FILE_PATH")

    def execute(self, context):
        context.scene.batch_model_animator.model_files.add().name = self.filepath
        return {'FINISHED'}

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

class BatchModelAnimatorRemove(bpy.types.Operator):
    bl_idname = "object.batch_model_animator_remove"
    bl_label = "Remove Model File"

    def execute(self, context):
        animator = context.scene.batch_model_animator
        index = animator.model_files_index
        animator.model_files.remove(index)
        if index > 0:
            animator.model_files_index = index - 1
        else:
            animator.model_files_index = 0
        return {'FINISHED'}

def register():
    bpy.utils.register_class(BatchModelAnimatorProperties)
    bpy.utils.register_class(BatchModelAnimator)
    bpy.utils.register_class(BatchModelAnimatorPanel)
    bpy.utils.register_class(BatchModelAnimatorAdd)
    bpy.utils.register_class(BatchModelAnimatorRemove)
    bpy.types.Scene.batch_model_animator = bpy.props.PointerProperty(type=BatchModelAnimatorProperties)

def unregister():
    bpy.utils.unregister_class(BatchModelAnimatorProperties)
    bpy.utils.unregister_class(BatchModelAnimator)
    bpy.utils.unregister_class(BatchModelAnimatorPanel)
    bpy.utils.unregister_class(BatchModelAnimatorAdd)
    bpy.utils.unregister_class(BatchModelAnimatorRemove)
    del bpy.types.Scene.batch_model_animator

if __name__ == "__main__":
    register()

bl_info = {
    "name": "Batch Model Animator",
    "blender": (2, 80, 0),
    "category": "Object",
}

import bpy
import os
import locale

# Detect system language
system_lang = locale.getdefaultlocale()[0]

# Define messages for English, Simplified Chinese, Traditional Chinese, and Japanese
messages = {
    'en': {
        'no_armature_or_animation': "The animated model does not have an armature or animation data",
        'failed_reimport_armature': "Failed to re-import the animated model's armature",
        'failed_find_armature': "Failed to find armature in model",
        'add_model_file': "Add Model File",
        'remove_model_file': "Remove Model File",
        'batch_model_animator': "Batch Model Animator",
        'batch_model_animator_desc': "Batch process multiple model files, aligning their positions and animations to an animated model, and export processed models",
    },
    'zh': {
        'no_armature_or_animation': "动画模型没有骨架或动画数据",
        'failed_reimport_armature': "重新导入动画模型的骨架失败",
        'failed_find_armature': "未能在模型中找到骨架",
        'add_model_file': "添加模型文件",
        'remove_model_file': "删除模型文件",
        'batch_model_animator': "批量模型动画器",
        'batch_model_animator_desc': "批量处理多个模型文件，将其位置和动画对齐到一个带动画的模型，并导出处理后的模型",
    },
    'zh_tw': {
        'no_armature_or_animation': "動畫模型沒有骨架或動畫數據",
        'failed_reimport_armature': "重新導入動畫模型的骨架失敗",
        'failed_find_armature': "未能在模型中找到骨架",
        'add_model_file': "添加模型文件",
        'remove_model_file': "刪除模型文件",
        'batch_model_animator': "批量模型動畫器",
        'batch_model_animator_desc': "批量處理多個模型文件，將其位置和動畫對齊到一個帶動畫的模型，並導出處理後的模型",
    },
    'ja': {
        'no_armature_or_animation': "アニメーションモデルにはアーマチュアまたはアニメーションデータがありません",
        'failed_reimport_armature': "アニメーションモデルのアーマチュアの再インポートに失敗しました",
        'failed_find_armature': "モデルにアーマチュアを見つけられませんでした",
        'add_model_file': "モデルファイルを追加",
        'remove_model_file': "モデルファイルを削除",
        'batch_model_animator': "バッチモデルアニメーター",
        'batch_model_animator_desc': "複数のモデルファイルを一括処理し、位置とアニメーションをアニメーションモデルに合わせ、処理されたモデルをエクスポートします",
    }
}

# Select appropriate language based on system setting
if system_lang.startswith('zh_TW'):
    lang = 'zh_tw'
elif system_lang.startswith('zh'):
    lang = 'zh'
elif system_lang.startswith('ja'):
    lang = 'ja'
else:
    lang = 'en'

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
    """{}""".format(messages[lang]['batch_model_animator_desc'])
    bl_idname = "object.batch_model_animator"
    bl_label = messages[lang]['batch_model_animator']
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
            self.report({'ERROR'}, messages[lang]['no_armature_or_animation'])
            return {'CANCELLED'}

        animations = [action for action in bpy.data.actions]
        total_steps = len(animations) * len(model_files)
        current_step = 0

        bpy.context.window_manager.progress_begin(0, total_steps)
        
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
                    self.report({'ERROR'}, messages[lang]['failed_reimport_armature'])
                    return {'CANCELLED'}

                model_armature.location = animated_armature.location

                for animation in animations:
                    model_armature.animation_data_create()
                    model_armature.animation_data.action = animation

                    bpy.context.view_layer.update()
                    bpy.context.view_layer.objects.active = model_armature
                    bpy.ops.object.mode_set(mode='OBJECT')
                    model_armature.location = (0, 0, 0)
                    model_armature.rotation_euler = (0, 0, 0)

                    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
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

                    current_step += 1
                    bpy.context.window_manager.progress_update(current_step)
                    bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP', iterations=1)
            else:
                self.report({'ERROR'}, f"{messages[lang]['failed_find_armature']} {model_file}")

        bpy.context.window_manager.progress_end()

        return {'FINISHED'}

class BatchModelAnimatorPanel(bpy.types.Panel):
    """Creates a Panel in the Object properties window"""
    bl_label = messages[lang]['batch_model_animator']
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
    bl_label = messages[lang]['add_model_file']
    filepath: bpy.props.StringProperty(subtype="FILE_PATH")

    def execute(self, context):
        context.scene.batch_model_animator.model_files.add().name = self.filepath
        return {'FINISHED'}

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

class BatchModelAnimatorRemove(bpy.types.Operator):
    bl_idname = "object.batch_model_animator_remove"
    bl_label = messages[lang]['remove_model_file']

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

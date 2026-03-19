import React from 'react';

interface PostEditorProps {
  post: any;
  onSave: (post: any) => Promise<void> | void;
  onClose: () => void;
}

export const PostEditor: React.FC<PostEditorProps> = ({ post, onSave, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4">{post?.id ? 'עריכת פוסט' : 'פוסט חדש'}</h2>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-900 rounded-xl font-bold">ביטול</button>
          <button onClick={() => onSave(post)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">שמור</button>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;

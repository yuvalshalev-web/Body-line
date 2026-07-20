const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EditMemberForm.tsx', 'utf-8');

const startStr = `              <motion.div 
                                  <form onSubmit={handlePasswordChange} className="space-y-6">`;
                                  
const endStr = `                      עדכן סיסמה
                    </button>
                  </form>`;

const replacement = `              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowPasswordModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md luxury-slab rounded-[2rem] overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-[#2B2B2E] flex items-center gap-3">
                      <Key className="text-indigo-500" />
                      החלפת סיסמה
                    </h3>
                    <button 
                      onClick={() => setShowPasswordModal(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    {editingMember.uid ? (
                      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <p>המשתמש כבר מחובר למערכת החדשה. לא ניתן לקבוע סיסמה באופן ידני, אלא רק לשלוח למשתמש מייל לאיפוס סיסמה בו הוא יוכל לבחור סיסמה חדשה בעצמו.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest pr-3">סיסמה חדשה</label>
                          <input 
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full p-4 luxury-card rounded-2xl font-black outline-none focus:ring-2 ring-indigo-500/20 transition-all text-[#2B2B2E] placeholder:text-slate-400"
                            placeholder="הזן סיסמה חדשה"
                            required
                            minLength={6}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest pr-3">אימות סיסמה</label>
                          <input 
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full p-4 luxury-card rounded-2xl font-black outline-none focus:ring-2 ring-indigo-500/20 transition-all text-[#2B2B2E] placeholder:text-slate-400"
                            placeholder="הזן שוב את הסיסמה"
                            required
                            minLength={6}
                          />
                        </div>
                      </>
                    )}
                    <button 
                      type="submit"
                      disabled={isChangingPassword || (!editingMember.uid && (!newPassword || !confirmPassword))}
                      className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isChangingPassword ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      {editingMember.uid ? 'שליחת מייל איפוס סיסמה' : 'עדכן סיסמה'}
                    </button>
                  </form>`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/components/admin/EditMemberForm.tsx', code, 'utf-8');
  console.log('Fixed');
} else {
  console.log('Not found');
  console.log('startIndex:', startIndex);
  console.log('endIndex:', endIndex);
}

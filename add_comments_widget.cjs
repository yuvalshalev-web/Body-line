const fs = require('fs');
let content = fs.readFileSync('src/components/SurfCallsWidget.tsx', 'utf8');

// We need to import useState from react if not already, but it's already there.
// Add a state for comment input: commentTexts[callId]
content = content.replace(
  "const [newCall, setNewCall] = useState({",
  "const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});\n  const { addSurfCallComment } = useData();\n  const [newCall, setNewCall] = useState({"
);

const commentSection = `
                          {/* Comments Section */}
                          <div className="pt-4 border-t border-slate-100">
                            <div className="space-y-3 mb-3 max-h-32 overflow-y-auto pr-2">
                              {(call.comments || []).map(comment => (
                                <div key={comment.id} className="flex gap-2">
                                  {comment.avatar ? (
                                    <img src={comment.avatar} alt={comment.userName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold shrink-0">
                                      {comment.userName.charAt(0)}
                                    </div>
                                  )}
                                  <div className="bg-slate-50 rounded-xl rounded-tr-none px-3 py-2 text-sm">
                                    <span className="font-bold text-xs text-sky-600 block mb-0.5">{comment.userName}</span>
                                    <span className="text-slate-700">{comment.text}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {!isPastDeadline && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="כתוב תגובה..."
                                  value={commentTexts[call.id] || ''}
                                  onChange={e => setCommentTexts({ ...commentTexts, [call.id]: e.target.value })}
                                  onKeyDown={async e => {
                                    if (e.key === 'Enter' && commentTexts[call.id]?.trim()) {
                                      await addSurfCallComment(call.id, currentUser.id, \`\${currentUser.firstName} \${currentUser.lastName}\`, currentUser.avatar, commentTexts[call.id].trim());
                                      setCommentTexts({ ...commentTexts, [call.id]: '' });
                                    }
                                  }}
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-sky-500"
                                />
                                <button
                                  onClick={async () => {
                                    if (commentTexts[call.id]?.trim()) {
                                      await addSurfCallComment(call.id, currentUser.id, \`\${currentUser.firstName} \${currentUser.lastName}\`, currentUser.avatar, commentTexts[call.id].trim());
                                      setCommentTexts({ ...commentTexts, [call.id]: '' });
                                    }
                                  }}
                                  disabled={!commentTexts[call.id]?.trim()}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-50"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              </div>
                            )}
                          </div>
`;

content = content.replace(
  "</div>\n                        </div>\n                      );",
  commentSection + "\n                        </div>\n                      );"
);

fs.writeFileSync('src/components/SurfCallsWidget.tsx', content);

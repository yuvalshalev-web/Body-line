with open('/app/applet/src/pages/SystemSettingsPage.tsx', 'r') as f:
    content = f.read()

stack = []
for i, char in enumerate(content):
    if char == '(':
        stack.append(i)
    elif char == ')':
        if not stack:
            print(f"Unmatched ')' at index {i}")
            break
        stack.pop()
if stack:
    print(f"Unmatched '(' at indices {stack}")

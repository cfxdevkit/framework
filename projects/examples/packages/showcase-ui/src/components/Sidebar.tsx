import './sidebar.css';

export interface SidebarItem {
  id: string;
  label: string;
}

export interface SidebarGroup {
  label?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  groups: SidebarGroup[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function Sidebar({ groups, activeId, onSelect }: SidebarProps) {
  return (
    <nav className="cfx-sidebar" aria-label="Section navigation">
      {groups.map((group, gi) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static group list
        <div key={gi} className="cfx-sidebar-group">
          {group.label && <div className="cfx-sidebar-group-label">{group.label}</div>}
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`cfx-sidebar-item${activeId === item.id ? ' active' : ''}`}
              onClick={() => onSelect?.(item.id)}
              aria-current={activeId === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function EmptyState({ icon: Icon, title, text, action }) {
    return <div className="card empty-state">
{Icon &&
    <div className="empty-icon">

        <Icon size={30}/>

    </div>
}
    <h3>
{title}
    </h3>
    <p>
{text}
    </p>
{action}</div>;
}

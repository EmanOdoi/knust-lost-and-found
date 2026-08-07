export default function StatusStamp({ status }) {
  const cls =
    status === "Lost" ? "stamp-lost" : status === "Found" ? "stamp-found" : "stamp-recovered";
  return <span className={cls}>{status}</span>;
}

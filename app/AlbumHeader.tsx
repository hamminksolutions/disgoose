/** Cover + title + artist, shown identically whether a rating card is read-only or being edited. */
export function AlbumHeader({
  album,
}: {
  album: { title: string; artist: string; coverUrl: string | null };
}) {
  return (
    <div className="flex gap-[12px]">
      <div className="aspect-square w-[64px] shrink-0 overflow-hidden rounded-md bg-surface-raised">
        {album.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div>
        <p className="font-heading text-[15px] font-semibold text-text-primary">{album.title}</p>
        <p className="text-[13px] text-text-secondary">{album.artist}</p>
      </div>
    </div>
  );
}

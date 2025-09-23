// Buscar línea 462 y reemplazar
//                <AvatarImage src={poll.author?.avatar_url || "https://github.com/shadcn.png"} />
// POR:
                <AvatarImage 
                  src={poll.author?.avatar_url && poll.author.avatar_url !== null ? poll.author.avatar_url : undefined} 
                />
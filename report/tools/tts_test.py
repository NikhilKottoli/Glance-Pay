import asyncio, os, sys
import edge_tts

OUT = os.path.join(os.path.dirname(__file__), "..", "narration", "_tts_test.mp3")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

async def main():
    voice = "en-US-GuyNeural"
    comm = edge_tts.Communicate("Glance Pay. Hands free payments on smart glasses.", voice)
    await comm.save(OUT)
    print("SAVED", OUT, os.path.getsize(OUT))

if __name__ == "__main__":
    asyncio.run(main())
